import { MaterialRate } from '../models/index.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { calculateEstimate } from '../lib/estimate.js'
import { DEFAULT_CITY, findCity } from '../lib/cities.js'

export { DEFAULT_CITY }

// Rates for a city. A material the city has no price for falls back to its
// nearest listed cities, then Faisalabad, then the built-in starting rates
// (always shown as unverified).
export async function ratesForCity(city = DEFAULT_CITY) {
  const known = findCity(city)
  const name = known?.name ?? city
  const cities = [...new Set([name, ...(known?.near ?? []), DEFAULT_CITY])]
  const docs = await MaterialRate.find({ city: { $in: cities } })
  const rates = {}
  for (const fallback of DEFAULT_RATES) rates[fallback.key] = { ...fallback, status: 'unverified', source: { origin: 'seed' } }
  for (const target of [...cities].reverse()) {
    for (const doc of docs.filter((d) => d.city === target)) {
      rates[doc.key] = {
        name: doc.name,
        unit: doc.unit,
        ratePkr: doc.ratePkr,
        status: doc.displayStatus,
        checkedAt: doc.verifiedAt ?? null,
        source: { ...doc.source?.toObject?.(), city: doc.city }
      }
    }
  }
  return rates
}

export async function estimateFor({ widthFt, depthFt, floors, roofHeightFt, city }) {
  const name = findCity(city)?.name ?? (city || DEFAULT_CITY)
  const rates = await ratesForCity(name)
  return { city: name, ...calculateEstimate({ widthFt, depthFt, floors, roofHeightFt }, rates) }
}
