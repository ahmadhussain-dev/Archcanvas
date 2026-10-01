import { MaterialRate } from '../models/index.js'
import { DEFAULT_RATES } from '../seed/materialRates.js'
import { calculateEstimate } from '../lib/estimate.js'

export const DEFAULT_CITY = 'Faisalabad'

// Rates for a city. Missing materials fall back to Faisalabad, then to the
// built-in placeholder rates (always shown as unverified).
export async function ratesForCity(city = DEFAULT_CITY) {
  const cities = city === DEFAULT_CITY ? [city] : [city, DEFAULT_CITY]
  const docs = await MaterialRate.find({ city: { $in: cities } })
  const rates = {}
  for (const fallback of DEFAULT_RATES) rates[fallback.key] = { ...fallback, status: 'unverified' }
  for (const target of [...cities].reverse()) {
    for (const doc of docs.filter((d) => d.city === target)) {
      rates[doc.key] = { name: doc.name, unit: doc.unit, ratePkr: doc.ratePkr, status: doc.displayStatus }
    }
  }
  return rates
}

export async function estimateFor({ widthFt, depthFt, floors, roofHeightFt, city }) {
  const rates = await ratesForCity(city || DEFAULT_CITY)
  return { city: city || DEFAULT_CITY, ...calculateEstimate({ widthFt, depthFt, floors, roofHeightFt }, rates) }
}
