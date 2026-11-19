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
// Every number below is a tunable planning figure, not a quote. Where each one
// comes from, and how to update them, is in docs/price-sources.md. In short:
//   - cement and steel: PBS weekly SPI city prices (17 Nov 2026) and the
//     ICONS brand lists (19 Nov 2026), the same lists the daily check reads;
//   - bricks, sand, crush and mason wages: the PBS urban construction input
//     prices by city (January 2026, The News 3 Feb 2026), moved forward with
//     PBS's +6.6% construction input index (Oct 2026 on a year earlier) and
//     checked against Nov 2026 dealer lists;
//   - labour: Zameen's 10 Marla grey structure calculator (labour ~Rs 480-500
//     per sq ft, 16 Oct and 11 Nov 2026) and Lahore labour-only quotes (Rs 450-850).
import { findCity, DEFAULT_CITY } from './cities.js'

export const REFERENCE_DATE = '2026-11-19'

// Faisalabad, 19 November 2026. To update: change ratePkr and `checked`, then
// run `npm test` in api/ (tests/calibration.test.js checks each city still
// lands inside its market range).
export const REFERENCE_RATES = [
  // Grade 60 sariya: ICONS brands Rs 256-261/kg; PBS SPI Rs 254-263/kg (17 Nov 2026).
  { key: 'steel', name: 'Steel (sariya)', unit: 'ton', ratePkr: 257000, checked: '2026-11-19' },
  // PBS SPI Faisalabad Rs 1,580 (17 Nov 2026); ICONS brand list Rs 1,505-1,610.
  { key: 'cement', name: 'Cement', unit: 'bag (50 kg)', ratePkr: 1560, checked: '2026-11-17' },
  // First-class (awwal) brick, ex-kiln plus local delivery: Rs 15,000-19,000 per 1,000.
  { key: 'bricks', name: 'Bricks', unit: 'brick', ratePkr: 17, checked: '2026-11-19' },
  // Mix of Ravi sand (masonry, plaster) and Chenab sand (concrete): Rs 50-75/cft.
  { key: 'sand', name: 'Sand', unit: 'cft', ratePkr: 65, checked: '2026-11-19' },
  // Sargodha crush, close to Faisalabad: Rs 130-160/cft delivered.
  { key: 'crush', name: 'Crush (bajri)', unit: 'cft', ratePkr: 145, checked: '2026-11-19' },
  // Labour-only contract (theka) for the grey structure, shuttering included.
  { key: 'labour', name: 'Labour', unit: 'sq ft', ratePkr: 480, checked: '2026-11-16' },
  // Conduits, wiring pipes, water supply, drainage and gas pipes with fittings
  // (Zameen 10 Marla plumbing and electric material, without pumps: ~Rs 170/sq ft).
  { key: 'pipes', name: 'Plumbing and electric pipes', unit: 'sq ft', ratePkr: 170, checked: '2026-11-16' }
]

// Materials the online check reads. All others are always worked out here.
export const LIVE_KEYS = ['cement', 'steel']
export const LOCAL_KEYS = REFERENCE_RATES.map((r) => r.key).filter((k) => !LIVE_KEYS.includes(k))

// Price of each material in a region compared with Faisalabad (1 = the same).
// Cement follows the PBS SPI city prices of 17 Nov 2026; steel, bricks, sand,
// crush and wages follow the PBS January 2026 city prices (see the doc).
export const REGION_FACTORS = {
  // Faisalabad, Sargodha, Jhang, Sahiwal and the rest of central Punjab.
  'central-punjab': { steel: 1, cement: 1, bricks: 1, sand: 1, crush: 1, labour: 1, pipes: 1 },
  // Lahore, Gujranwala, Sialkot and nearby: PBS bricks Rs 17,463/1,000 in Lahore,
  // cement Rs 1,653, and PBS materials per sq ft ~7% (Lahore) to ~12% (Gujranwala) above Faisalabad.
  lahore: { steel: 1, cement: 1.05, bricks: 1.08, sand: 1.05, crush: 1.05, labour: 1.07, pipes: 1 },
  // Islamabad, Rawalpindi and nearby: PBS bricks Rs 24,732 and sand 1.55x Lahore; crush from Margalla close by.
  potohar: { steel: 1.03, cement: 0.97, bricks: 1.45, sand: 1.5, crush: 0.95, labour: 1.1, pipes: 1.02 },
  // Multan, Bahawalpur and south Punjab: PBS mason wage Rs 1,909 (Lahore Rs 2,461); crush comes a long way.
  'south-punjab': { steel: 1, cement: 1.05, bricks: 0.92, sand: 0.95, crush: 1.1, labour: 0.88, pipes: 1 },
  // Karachi: PBS bricks Rs 18,000, cheap Malir sand and Karachi crush, highest mason wage (Rs 2,478-2,482).
  karachi: { steel: 1, cement: 0.95, bricks: 1.12, sand: 0.95, crush: 0.8, labour: 1.1, pipes: 1 },
  // Hyderabad, Sukkur and the rest of Sindh: lowest PBS material cost per sq ft.
  sindh: { steel: 0.98, cement: 1.02, bricks: 0.8, sand: 0.75, crush: 0.85, labour: 0.85, pipes: 1 },
  // Peshawar and Khyber Pakhtunkhwa: PBS bricks Rs 18,331, cheap sand and crush.
  kp: { steel: 0.99, cement: 1.01, bricks: 1.1, sand: 0.85, crush: 0.8, labour: 0.95, pipes: 1.02 },
  // Quetta, Turbat: cheaper bricks (Rs 14,742), dearer steel (+7% on Lahore), long hauls.
  balochistan: { steel: 1.05, cement: 1, bricks: 0.9, sand: 0.9, crush: 0.85, labour: 0.97, pipes: 1.05 }
}

const REGION_BY_CITY = {
  Lahore: 'lahore', Gujranwala: 'lahore', Sialkot: 'lahore', Sheikhupura: 'lahore', Kasur: 'lahore',
  Gujrat: 'lahore', Kamoke: 'lahore', Hafizabad: 'lahore',
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
