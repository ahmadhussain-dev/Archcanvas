import { MaterialRate, RegionAdjustment } from '../models/index.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { calculateEstimate } from '../lib/estimate.js'
import { DEFAULT_CITY, NATIONAL, findCity } from '../lib/cities.js'
import { estimatedRate } from '../lib/localPrices.js'
import { adjustmentFor, regionTable } from '../lib/cityAdjustments.js'

export { DEFAULT_CITY }

const fromEstimate = (key, market, at = null) => {
  const est = estimatedRate(key, market)
  return {
    name: est.name,
    unit: est.unit,
    ratePkr: est.ratePkr,
    status: 'estimated',
    checkedAt: at,
    source: { origin: 'estimate', market: est.market }
  }
}

// The national rates. A material with no saved price, a price older than 30
// days, or a starting value uses the automatic national price instead.
async function nationalRates() {
  const docs = await MaterialRate.find({ city: NATIONAL })
  const market = docs.find((d) => d.source?.origin === 'estimate' && d.source.market)?.source.market ?? 1
  const rates = {}
  for (const { key } of DEFAULT_RATES) {
    const doc = docs.find((d) => d.key === key)
    const usable = doc && doc.source?.origin !== 'seed' && ['verified', 'estimated'].includes(doc.displayStatus)
    rates[key] = usable
      ? {
          name: doc.name,
          unit: doc.unit,
          ratePkr: doc.ratePkr,
          status: doc.displayStatus,
          checkedAt: doc.verifiedAt ?? null,
          source: doc.source?.toObject?.() ?? doc.source
        }
      : fromEstimate(key, market)
  }
  return rates
}

// { [region]: pct } that admins have set.
export async function savedAdjustments() {
  const rows = await RegionAdjustment.find()
  return Object.fromEntries(rows.map((r) => [r.region, r.pct]))
}

export async function regionAdjustments() {
  return regionTable(await savedAdjustments())
}

export async function estimateFor({ widthFt, depthFt, floors, roofHeightFt, city }) {
  const name = findCity(city)?.name ?? (city || DEFAULT_CITY)
  const [rates, saved] = await Promise.all([nationalRates(), savedAdjustments()])
  const location = { ...adjustmentFor(name, saved), city: name }
  return { city: name, ...calculateEstimate({ widthFt, depthFt, floors, roofHeightFt }, rates, location) }
}
