// The daily price check, fully automatic. For each source in rateSources.js it
// downloads the page, reads the prices, and saves one price per city as
// verified, with where it came from. Cities a page doesn't list use their
// nearest listed city (see lib/cities.js), then the Pakistan average from the
// same page. Then every other material (bricks, sand, crush, labour, pipes) is
// worked out for each city (lib/localPrices.js), and so are cement and steel
// wherever the online check has no fresh price. Nobody has to type a price.
import { MaterialRate, RateCheck } from '../models/index.js'
import { STALE_AFTER_DAYS } from '../models/MaterialRate.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { CITIES, CITY_NAMES } from '../lib/cities.js'
import { LIVE_KEYS, REGION_FACTORS, estimatedRate, marketFactor, regionOf } from '../lib/localPrices.js'
import { RATE_SOURCES, fetchPage as downloadPage } from './rateSources.js'

export const CHECK_EVERY_MS = 24 * 60 * 60 * 1000
// After a failed check, try again sooner than the next day.
export const RETRY_AFTER_MS = 3 * 60 * 60 * 1000
// An online price that moves more than this since yesterday waits one more
// check: if the site still shows about the same price (within CONFIRM_WITHIN),
// it is taken. A misread page rarely gives the same wrong number twice.
export const MAX_DAILY_JUMP = 0.3
export const CONFIRM_WITHIN = 0.05
// An admin price overrides the automatic one for this long, then the automatic one takes over.
export const OVERRIDE_DAYS = STALE_AFTER_DAYS
const DAY_MS = 86_400_000
const HISTORY_LIMIT = 50

const isFresh = (rate, now) => rate.verifiedAt && now - rate.verifiedAt.getTime() <= OVERRIDE_DAYS * DAY_MS
const isOverride = (rate, now) => rate.source?.origin === 'admin' && rate.status === 'verified' && isFresh(rate, now)

function setPrice(rate, value, at, origin) {
  if (value === rate.ratePkr) return false
  rate.ratePkr = value
  rate.history.push({ ratePkr: value, at, origin })
  if (rate.history.length > HISTORY_LIMIT) rate.history.splice(0, rate.history.length - HISTORY_LIMIT)
  return true
}

// Puts the automatic city price on a rate row. Returns true if the price changed.
export function applyEstimate(rate, at, market = 1) {
  const est = estimatedRate(rate.key, rate.city, market)
  const changed = setPrice(rate, est.ratePkr, at, 'estimate')
  rate.status = 'verified'
  rate.verifiedAt = at
  rate.verifiedBy = undefined
  rate.pending = undefined
  rate.source = { origin: 'estimate', name: 'ArchCanvas city prices', region: est.region, market: est.market }
  return changed
}

// Gives every city a row for every material, starting at the automatic price
// for that city. Existing rows are untouched.
export async function ensureCityRates(at = new Date()) {
  const ops = []
  for (const city of CITIES) {
    for (const fallback of DEFAULT_RATES) {
      const est = estimatedRate(fallback.key, city.name)
      ops.push({
        updateOne: {
          filter: { key: fallback.key, city: city.name },
          update: {
            $setOnInsert: {
              key: fallback.key,
              name: fallback.name,
              unit: fallback.unit,
              ratePkr: est.ratePkr,
              city: city.name,
              status: 'verified',
              verifiedAt: at,
              source: { origin: 'estimate', name: 'ArchCanvas city prices', region: est.region, market: 1 },
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

// Today's online cement price in Faisalabad terms (each city's price divided by
// its regional factor, then the median), or null when no fresh online price exists.
export function cementIndex(cementRates, now = Date.now()) {
  const values = cementRates
    .filter((r) => r.source?.origin === 'auto' && isFresh(r, now))
    .map((r) => r.ratePkr / (REGION_FACTORS[regionOf(r.city)].cement ?? 1))
    .sort((a, b) => a - b)
  if (!values.length) return null
  const mid = Math.floor(values.length / 2)
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2
}

// Works out every price that has no fresh online or admin price.
export async function updateCityPrices(at = new Date()) {
  const now = at.getTime()
  const rates = await MaterialRate.find({ city: { $in: CITY_NAMES } })
  const market = marketFactor(cementIndex(rates.filter((r) => r.key === 'cement'), now))
  const result = { key: 'city', source: 'ArchCanvas city prices', ok: true, changed: 0, unchanged: 0, held: [] }
  let kept = 0
  for (const rate of rates) {
    if (isOverride(rate, now)) {
      kept++
      continue
    }
    if (LIVE_KEYS.includes(rate.key) && rate.source?.origin === 'auto' && isFresh(rate, now)) continue
    if (applyEstimate(rate, at, market)) result.changed++
    else result.unchanged++
    await rate.save()
  }
  const nudge = market === 1 ? '' : ` Market change since the reference prices: ${market > 1 ? '+' : ''}${Math.round((market - 1) * 1000) / 10}%.`
  const admin = kept ? ` ${kept} admin prices kept.` : ''
  result.message = `${result.changed + result.unchanged} prices worked out for ${CITIES.length} cities, ${result.changed} changed.${nudge}${admin}`
  return result
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
    // An admin price is kept for 30 days, then the online price takes over.
    if (isOverride(rate, at.getTime())) continue
    const old = rate.ratePkr
    // A big overnight move from yesterday's online price is more likely a misread
    // page than the market. Wait for the next check to show the same price.
    if (rate.source?.origin === 'auto' && old > 0 && Math.abs(price.value - old) / old > MAX_DAILY_JUMP) {
      const waiting = rate.pending?.ratePkr
      const confirmed = waiting > 0 && Math.abs(price.value - waiting) / waiting <= CONFIRM_WITHIN
      if (!confirmed) {
        rate.pending = { ratePkr: price.value, at }
        await rate.save()
        result.held.push(city.name)
        continue
      }
    }
    if (setPrice(rate, price.value, at, 'auto')) result.changed++
    else result.unchanged++
    rate.status = 'verified'
    rate.verifiedAt = at
    rate.verifiedBy = undefined
    rate.pending = undefined
    rate.source = { origin: 'auto', name: source.name, url: source.url, basedOn: price.basedOn }
    await rate.save()
  }

  if (!found) {
    result.message = 'No prices found on the page. The site layout may have changed.'
    return result
  }
  result.ok = true
  const held = result.held.length ? `, ${result.held.length} big jumps waiting for the next check to confirm` : ''
  result.message = `${result.changed} cities changed, ${result.unchanged} the same${held}.`
  return result
}

async function runCheck({ fetchPage = downloadPage, sources = RATE_SOURCES, trigger = 'schedule' }) {
  const check = await RateCheck.create({ trigger, startedAt: new Date() })
  await ensureCityRates()
  for (const source of sources) check.results.push(await checkSource(source, fetchPage, new Date()))
  // Always runs, even when every website failed, so no city is left on a starting value.
  check.results.push(await updateCityPrices(new Date()))
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
