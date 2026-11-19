// Automatic prices for every city, with no admin step.
//
// Cement and steel come from the daily online check (services/rateSources.js).
// No website lists bricks, sand, crush, labour or pipes city by city every day,
// so those are worked out here: a reference price (Faisalabad, November 2026)
// times a regional factor for the city, then nudged by how the live cement
// price has moved since the reference date, because kiln fuel, diesel and
// wages tend to move with it. The same rule is the fallback for cement and
// steel when the online check has never worked for a city or its price is
// older than 30 days.
//
// Every number below is a tunable planning figure, not a quote. The regional
// factors follow the January 2026 city prices from the government's urban
// construction price survey (bricks, sand, bajri and mason wages for
// Islamabad, Karachi, Lahore, Peshawar and Quetta), reported by The News on
// 3 February 2026, plus typical market ranges for the other regions.
import { findCity, DEFAULT_CITY } from './cities.js'

export const REFERENCE_DATE = '2026-11'

// Faisalabad, November 2026.
export const REFERENCE_RATES = [
  { key: 'steel', name: 'Steel (sariya)', unit: 'ton', ratePkr: 248000 },
  { key: 'cement', name: 'Cement', unit: 'bag (50 kg)', ratePkr: 1450 },
  { key: 'bricks', name: 'Bricks', unit: 'brick', ratePkr: 17 },
  { key: 'sand', name: 'Sand', unit: 'cft', ratePkr: 75 },
  { key: 'crush', name: 'Crush (bajri)', unit: 'cft', ratePkr: 170 },
  // Labour-only contract (theka) for the grey structure.
  { key: 'labour', name: 'Labour', unit: 'sq ft', ratePkr: 500 },
  { key: 'pipes', name: 'Plumbing and electric pipes', unit: 'sq ft', ratePkr: 130 }
]

// Materials the online check reads. All others are always worked out here.
export const LIVE_KEYS = ['cement', 'steel']
export const LOCAL_KEYS = REFERENCE_RATES.map((r) => r.key).filter((k) => !LIVE_KEYS.includes(k))

// Price of each material in a region compared with Faisalabad (1 = the same).
export const REGION_FACTORS = {
  // Lahore, Faisalabad, Gujranwala and the rest of central Punjab.
  'central-punjab': { steel: 1, cement: 1, bricks: 1, sand: 1, crush: 1, labour: 1, pipes: 1 },
  // Islamabad, Rawalpindi and nearby: dear bricks and sand, crush from Margalla close by.
  potohar: { steel: 1.02, cement: 0.98, bricks: 1.35, sand: 1.3, crush: 0.9, labour: 1.08, pipes: 1 },
  // Multan, Bahawalpur and south Punjab: crush comes a long way.
  'south-punjab': { steel: 1, cement: 1, bricks: 0.9, sand: 0.9, crush: 1.15, labour: 0.88, pipes: 1.02 },
  // Karachi: cheaper sand and crush, higher wages.
  karachi: { steel: 0.99, cement: 0.96, bricks: 1.05, sand: 0.85, crush: 0.8, labour: 1.1, pipes: 1 },
  // Hyderabad, Sukkur and the rest of Sindh.
  sindh: { steel: 0.98, cement: 0.97, bricks: 0.85, sand: 0.75, crush: 0.85, labour: 0.85, pipes: 1.02 },
  // Peshawar and Khyber Pakhtunkhwa.
  kp: { steel: 0.99, cement: 0.94, bricks: 1.05, sand: 0.85, crush: 0.8, labour: 0.9, pipes: 1.02 },
  // Quetta, Turbat: most goods travel further.
  balochistan: { steel: 1.06, cement: 1.02, bricks: 0.85, sand: 0.85, crush: 0.85, labour: 0.97, pipes: 1.05 }
}

const REGION_BY_CITY = {
  Karachi: 'karachi',
  Hyderabad: 'sindh', Sukkur: 'sindh', Larkana: 'sindh', Nawabshah: 'sindh', 'Mirpur Khas': 'sindh',
  Islamabad: 'potohar', Rawalpindi: 'potohar', 'Wah Cantonment': 'potohar', Abbottabad: 'potohar', Jhelum: 'potohar',
  Multan: 'south-punjab', Bahawalpur: 'south-punjab', 'Rahim Yar Khan': 'south-punjab', 'Dera Ghazi Khan': 'south-punjab',
  Sadiqabad: 'south-punjab', Burewala: 'south-punjab', Khanewal: 'south-punjab', Muzaffargarh: 'south-punjab',
  Peshawar: 'kp', Mardan: 'kp', Mingora: 'kp', Kohat: 'kp', 'Dera Ismail Khan': 'kp',
  Quetta: 'balochistan', Turbat: 'balochistan'
}

export function regionOf(city) {
  const name = findCity(city)?.name ?? city
  return REGION_BY_CITY[name] ?? 'central-punjab'
}

// How much of the live cement price's move since the reference date the local
// materials follow (0.5 = half), and how far the nudge may go either way.
export const MARKET_LINK = 0.5
export const MARKET_LIMITS = { min: 0.8, max: 1.25 }

// cementNow: today's average online cement price (Faisalabad terms), or null.
export function marketFactor(cementNow) {
  const base = REFERENCE_RATES.find((r) => r.key === 'cement').ratePkr
  if (!(cementNow > 0)) return 1
  const f = 1 + MARKET_LINK * (cementNow / base - 1)
  return Math.round(Math.min(MARKET_LIMITS.max, Math.max(MARKET_LIMITS.min, f)) * 1000) / 1000
}

// The automatic price of one material in one city.
export function estimatedRate(key, city = DEFAULT_CITY, market = 1) {
  const ref = REFERENCE_RATES.find((r) => r.key === key)
  if (!ref) return null
  const region = regionOf(city)
  const factor = REGION_FACTORS[region][key] ?? 1
  const raw = ref.ratePkr * factor * (LOCAL_KEYS.includes(key) ? market : 1)
  // Whole rupees, or to the nearest 0.5 for a single brick, and to Rs 100 for steel.
  const ratePkr = key === 'bricks' ? Math.round(raw * 2) / 2 : key === 'steel' ? Math.round(raw / 100) * 100 : Math.round(raw)
  return { key, name: ref.name, unit: ref.unit, ratePkr, region, regionFactor: factor, market }
}
