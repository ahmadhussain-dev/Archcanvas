// The daily price check, fully automatic. For each source in rateSources.js it
// downloads the page, reads the Pakistan-wide price (the middle of the cities
// and brands it lists), and saves it on the national row as verified, with
// where it came from. Then every other material (bricks, sand, crush, labour,
// pipes) is worked out from the national reference (lib/localPrices.js), and
// so are cement and steel when the online check has no fresh price. City
// differences are a simple percentage on the whole estimate
// (lib/cityAdjustments.js), not separate prices. Nobody has to type a price.
import { MaterialRate, RateCheck } from '../models/index.js'
import { STALE_AFTER_DAYS } from '../models/MaterialRate.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { NATIONAL } from '../lib/cities.js'
import { median } from '../lib/priceTables.js'
import { LIVE_KEYS, estimatedRate, marketFactor } from '../lib/localPrices.js'
import { RATE_SOURCES, fetchPage as downloadPage } from './rateSources.js'

export const CHECK_EVERY_MS = 24 * 60 * 60 * 1000
// After a failed check, try again sooner than the next day.
export const RETRY_AFTER_MS = 3 * 60 * 60 * 1000
// An online price that moves more than this since yesterday waits one more
// check: if the site still shows about the same price (within CONFIRM_WITHIN),
// it is taken. A misread page rarely gives the same wrong number twice.
const MAX_DAILY_JUMP = 0.3
const CONFIRM_WITHIN = 0.05
// An admin price overrides the automatic one for this long, then the automatic one takes over.
const OVERRIDE_DAYS = STALE_AFTER_DAYS
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

// Puts the automatic national price on a rate row. Returns true if the price changed.
export function applyEstimate(rate, at, market = 1) {
  const est = estimatedRate(rate.key, market)
  const changed = setPrice(rate, est.ratePkr, at, 'estimate')
  rate.status = 'verified'
  rate.verifiedAt = at
  rate.verifiedBy = undefined
  rate.pending = undefined
  rate.source = { origin: 'estimate', name: 'ArchCanvas national prices', market: est.market }
  return changed
}

// Gives the national list a row for every material, starting at the automatic
// price. Existing rows are untouched.
export async function ensureNationalRates(at = new Date()) {
  const ops = DEFAULT_RATES.map((fallback) => {
    const est = estimatedRate(fallback.key)
    return {
      updateOne: {
        filter: { key: fallback.key, city: NATIONAL },
        update: {
          $setOnInsert: {
            key: fallback.key,
            name: fallback.name,
            unit: fallback.unit,
            ratePkr: est.ratePkr,
            city: NATIONAL,
            status: 'verified',
            verifiedAt: at,
            source: { origin: 'estimate', name: 'ArchCanvas national prices', market: 1 },
            history: []
          }
        },
        upsert: true
      }
    }
  })
  const res = await MaterialRate.bulkWrite(ops, { ordered: false })
  return res.upsertedCount
}

// Today's national online cement price, or null when there is no fresh one.
function cementIndex(cement, now = Date.now()) {
  return cement && cement.source?.origin === 'auto' && isFresh(cement, now) ? cement.ratePkr : null
}

// Works out every national price that has no fresh online or admin price.
export async function updateNationalPrices(at = new Date()) {
  const now = at.getTime()
  const rates = await MaterialRate.find({ city: NATIONAL })
  const market = marketFactor(cementIndex(rates.find((r) => r.key === 'cement'), now))
  const result = { key: 'national', source: 'ArchCanvas national prices', ok: true, changed: 0, unchanged: 0, held: [] }
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
  result.message = `${result.changed + result.unchanged} national prices worked out, ${result.changed} changed.${nudge}${admin}`
  return result
}

// The Pakistan-wide price on a page: the source's own national figure, or the
// middle of the city prices it lists. null when the page gave nothing usable.
export function nationalPrice({ byCity, national }, { min, max }) {
  if (national >= min && national <= max) return Math.round(national)
  const values = Object.values(byCity ?? {}).filter((v) => v >= min && v <= max)
  const mid = median(values)
  return mid ? Math.round(mid) : null
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
  const value = nationalPrice(parsed, source)
  if (!value) {
    result.message = 'No prices found on the page. The site layout may have changed.'
    return result
  }
  result.ok = true
  const rate = await MaterialRate.findOne({ key: source.key, city: NATIONAL })
  // An admin price is kept for 30 days, then the online price takes over.
  if (!rate || isOverride(rate, at.getTime())) {
    result.message = `Pakistan price Rs ${value.toLocaleString('en-US')}; the admin price is kept.`
    return result
  }
  const old = rate.ratePkr
  // A big overnight move from yesterday's online price is more likely a misread
  // page than the market. Wait for the next check to show the same price.
  if (rate.source?.origin === 'auto' && old > 0 && Math.abs(value - old) / old > MAX_DAILY_JUMP) {
    const waiting = rate.pending?.ratePkr
    const confirmed = waiting > 0 && Math.abs(value - waiting) / waiting <= CONFIRM_WITHIN
    if (!confirmed) {
      rate.pending = { ratePkr: value, at }
      await rate.save()
      result.held.push(NATIONAL)
      result.message = `Pakistan price Rs ${value.toLocaleString('en-US')} is a big jump from Rs ${old.toLocaleString('en-US')}, waiting for the next check to confirm.`
      return result
    }
  }
  if (setPrice(rate, value, at, 'auto')) result.changed++
  else result.unchanged++
  rate.status = 'verified'
  rate.verifiedAt = at
  rate.verifiedBy = undefined
  rate.pending = undefined
  rate.source = { origin: 'auto', name: source.name, url: source.url, basedOn: 'Pakistan average' }
  await rate.save()
  result.message = `Pakistan price Rs ${value.toLocaleString('en-US')}${result.changed ? `, was Rs ${old.toLocaleString('en-US')}` : ', the same as before'}.`
  return result
}

async function runCheck({ fetchPage = downloadPage, sources = RATE_SOURCES, trigger = 'schedule' }) {
  const check = await RateCheck.create({ trigger, startedAt: new Date() })
  await ensureNationalRates()
  for (const source of sources) check.results.push(await checkSource(source, fetchPage, new Date()))
  // Always runs, even when every website failed, so nothing is left on a starting value.
  check.results.push(await updateNationalPrices(new Date()))
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
