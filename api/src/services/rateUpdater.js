// The daily online price check. For each source in rateSources.js it downloads
// the page, reads the prices, and saves one price per city as verified, with
// where it came from. Cities a page doesn't list use their nearest listed city
// (see lib/cities.js), then the Pakistan average from the same page.
import { MaterialRate, RateCheck } from '../models/index.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { CITIES, CITY_NAMES, DEFAULT_CITY } from '../lib/cities.js'
import { RATE_SOURCES, fetchPage as downloadPage } from './rateSources.js'

export const CHECK_EVERY_MS = 24 * 60 * 60 * 1000
// After a failed check, try again sooner than the next day.
export const RETRY_AFTER_MS = 3 * 60 * 60 * 1000
// A price that moves more than this since yesterday's check is held for an admin.
export const MAX_DAILY_JUMP = 0.3
const HISTORY_LIMIT = 50

// Gives every city a row for every material. New rows start from Faisalabad's
// current price (or the built-in starting value), marked unverified, so admins
// can set local prices for materials no website lists. Existing rows are untouched.
export async function ensureCityRates() {
  const base = await MaterialRate.find({ city: DEFAULT_CITY })
  const ops = []
  for (const city of CITIES) {
    for (const fallback of DEFAULT_RATES) {
      const from = base.find((b) => b.key === fallback.key)
      ops.push({
        updateOne: {
          filter: { key: fallback.key, city: city.name },
          update: {
            $setOnInsert: {
              key: fallback.key,
              name: from?.name ?? fallback.name,
              unit: from?.unit ?? fallback.unit,
              ratePkr: from?.ratePkr ?? fallback.ratePkr,
              city: city.name,
              status: 'unverified',
              source: { origin: 'seed', basedOn: city.name === DEFAULT_CITY ? undefined : DEFAULT_CITY },
              history: []
            }
          },
          upsert: true
        }
      })
    }
  }
  const res = await MaterialRate.bulkWrite(ops, { ordered: false })
  return res.upsertedCount
}

// Price lists name cities loosely ("Islamabad/Rawalpindi", " Lahore "), so index every part.
function listedPrices(byCity, { min, max }) {
  const listed = {}
  for (const [name, value] of Object.entries(byCity ?? {})) {
    if (!(value >= min && value <= max)) continue
    for (const part of name.split(/\/|,|&|\band\b/i)) {
      const key = part.trim().toLowerCase()
      if (key && listed[key] === undefined) listed[key] = value
    }
  }
  return listed
}

// { value, basedOn } for one city, or null when the page gave nothing usable.
export function priceForCity(city, { byCity, national }, bounds) {
  const listed = listedPrices(byCity, bounds)
  for (const near of city.near) {
    const value = listed[near.toLowerCase()]
    if (value !== undefined) return { value: Math.round(value), basedOn: near }
  }
  if (national >= bounds.min && national <= bounds.max) return { value: Math.round(national), basedOn: 'Pakistan average' }
  return null
}

async function checkSource(source, fetchPage, at) {
  const result = { key: source.key, source: source.name, url: source.url, ok: false, changed: 0, unchanged: 0, held: [] }
  let parsed
  try {
    parsed = source.parse(await fetchPage(source.url))
  } catch (err) {
    result.message = `Could not read the site: ${err.message}`
    return result
  }

  const rates = await MaterialRate.find({ key: source.key, city: { $in: CITY_NAMES } })
  let found = 0
  for (const city of CITIES) {
    const price = priceForCity(city, parsed, source)
    const rate = rates.find((r) => r.city === city.name)
    if (!price || !rate) continue
    found++
    const old = rate.ratePkr
    // A big overnight move from yesterday's automatic price is more likely a misread
    // page than the market. Keep the old price; an admin saving a price accepts it.
    if (rate.source?.origin === 'auto' && old > 0 && Math.abs(price.value - old) / old > MAX_DAILY_JUMP) {
      result.held.push(city.name)
      continue
    }
    if (price.value !== old) {
      rate.ratePkr = price.value
      rate.history.push({ ratePkr: price.value, at, origin: 'auto' })
      if (rate.history.length > HISTORY_LIMIT) rate.history.splice(0, rate.history.length - HISTORY_LIMIT)
      result.changed++
    } else {
      result.unchanged++
    }
    rate.status = 'verified'
    rate.verifiedAt = at
    rate.verifiedBy = undefined
    rate.source = { origin: 'auto', name: source.name, url: source.url, basedOn: price.basedOn }
    await rate.save()
  }

  if (!found) {
    result.message = 'No prices found on the page. The site layout may have changed.'
    return result
  }
  result.ok = true
  const held = result.held.length ? `, ${result.held.length} held for review` : ''
  result.message = `${result.changed} cities changed, ${result.unchanged} the same${held}.`
  return result
}

async function runCheck({ fetchPage = downloadPage, sources = RATE_SOURCES, trigger = 'schedule' }) {
  const check = await RateCheck.create({ trigger, startedAt: new Date() })
  await ensureCityRates()
  for (const source of sources) check.results.push(await checkSource(source, fetchPage, new Date()))
  check.finishedAt = new Date()
  await check.save()
  return check
}

// Runs a check now. If one is already running, waits for that one instead of starting another.
let running = null
export function checkRates(options = {}) {
  running ??= runCheck(options).finally(() => {
    running = null
  })
  return running
}

export async function latestCheck() {
  return RateCheck.findOne().sort({ startedAt: -1 })
}

// Is a check due? Daily after a good check, after a few hours if anything failed.
export function checkIsDue(last, now = Date.now()) {
  if (!last?.finishedAt) return true
  const allOk = last.results.length > 0 && last.results.every((r) => r.ok)
  return now - last.startedAt.getTime() >= (allOk ? CHECK_EVERY_MS : RETRY_AFTER_MS)
}

// Called once when the API starts. Looks every hour whether a check is due, so a
// laptop that was asleep or switched off catches up as soon as the API runs again.
export function startRateSchedule({ log = console, pollMs = 60 * 60 * 1000 } = {}) {
  async function tick() {
    try {
      if (!checkIsDue(await latestCheck())) return
      const check = await checkRates({ trigger: 'schedule' })
      for (const r of check.results) log.log(`Price check, ${r.key}: ${r.ok ? 'ok' : 'failed'}. ${r.message}`)
    } catch (err) {
      log.error('Price check failed:', err.message)
    }
  }
  tick()
  const timer = setInterval(tick, pollMs)
  timer.unref()
  return () => clearInterval(timer)
}
