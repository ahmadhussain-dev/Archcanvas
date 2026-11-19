import { MaterialRate } from '../models/index.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { calculateEstimate } from '../lib/estimate.js'
import { DEFAULT_CITY, findCity } from '../lib/cities.js'
import { estimatedRate } from '../lib/localPrices.js'

export { DEFAULT_CITY }

const fromEstimate = (key, city, market, at = null) => {
  const est = estimatedRate(key, city, market)
  return {
    name: est.name,
    unit: est.unit,
    ratePkr: est.ratePkr,
    status: 'estimated',
    checkedAt: at,
    source: { origin: 'estimate', region: est.region, market: est.market, city }
  }
}

// Rates for a city, always the city's own. A material with no saved price, a
// price older than 30 days, or an old starting value copied from another city
// uses the automatic price for this city (lib/localPrices.js) instead.
export async function ratesForCity(city = DEFAULT_CITY) {
  const name = findCity(city)?.name ?? city
  const docs = await MaterialRate.find({ city: name })
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
          source: { ...doc.source?.toObject?.(), city: doc.city }
        }
      : fromEstimate(key, name, market)
  }
  return rates
}

export async function estimateFor({ widthFt, depthFt, floors, roofHeightFt, city }) {
  const name = findCity(city)?.name ?? (city || DEFAULT_CITY)
  const rates = await ratesForCity(name)
  return { city: name, ...calculateEstimate({ widthFt, depthFt, floors, roofHeightFt }, rates) }
}
