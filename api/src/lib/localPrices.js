// One national price list for every material, with no admin step.
//
// Pinpoint accuracy for one city is not honestly possible: real quotes for the
// same house in the same city differ by 20% or more with covered area, steel
// grade, brick quality, design complexity, soil, labour and timing. So the
// estimate uses ONE national rate set (a typical big-city price, November 2026)
// and then moves the whole total up or down by a simple percentage for the
// city's region (lib/cityAdjustments.js, editable on /admin/prices).
//
// Cement and steel come from the daily online check (services/rateSources.js),
// as the Pakistan-wide middle of the price list. No website lists bricks, sand,
// crush, labour or pipes every day, so those are the national reference price
// nudged by how the live cement price has moved since the reference date,
// because kiln fuel, diesel and wages tend to move with it. The same reference
// is the fallback for cement and steel when the online check has never worked
// or its price is older than 30 days.
//
// Every number below is a tunable planning figure, not a quote. Where each one
// comes from, and how to update them, is in docs/price-sources.md. In short:
//   - a real contractor's 5 Marla grey structure quote (2,000 sq ft, 20 Oct 2026):
//     bricks Rs 25 (A+ awwal), cement Rs 1,650, steel Rs 255/kg, labour Rs 700/sq ft;
//   - PBS weekly SPI and ICONS brand lists for cement and steel (Nov 2026);
//   - PBS city construction input prices and dealer lists for bricks, sand, crush;
//   - Zameen's grey structure calculators for labour (Rs 480-500/sq ft).
// Where the contractor's A+ quote is above the market middle, the national
// price sits between the two; the "complex design / A+ material" end of the
// range covers the rest.

// National reference, 20 November 2026. To update: change ratePkr and `checked`,
// then run `npm test` in api/ (tests/calibration.test.js checks the result
// still lands inside the published ranges and near the contractor's quote).
export const REFERENCE_RATES = [
  // Grade 60 sariya: contractor Rs 255/kg (Oct 2026); ICONS brands Rs 256-261/kg; PBS SPI Rs 254-263/kg.
  { key: 'steel', name: 'Steel (sariya)', unit: 'ton', ratePkr: 257000, checked: '2026-11-19' },
  // Contractor Rs 1,650 (Bestway/DG); PBS SPI 17 Nov 2026 Rs 1,486-1,657 across cities; ICONS Rs 1,505-1,610.
  { key: 'cement', name: 'Cement', unit: 'bag (50 kg)', ratePkr: 1600, checked: '2026-11-20' },
  // First-class (awwal) brick delivered: dealers Rs 15,000-19,000 per 1,000;
  // PBS Islamabad Rs 24,700; contractor A+ quote Rs 25 each.
  { key: 'bricks', name: 'Bricks', unit: 'brick', ratePkr: 20, checked: '2026-11-20' },
  // Ravi sand (masonry, plaster) and Chenab sand (concrete): contractor Rs 60; dealers Rs 50-66.
  { key: 'sand', name: 'Sand', unit: 'cft', ratePkr: 62, checked: '2026-11-20' },
  // Sargodha crush: contractor Rs 165 (A plant); Lahore dealers Rs 130-137.
  { key: 'crush', name: 'Crush (bajri)', unit: 'cft', ratePkr: 150, checked: '2026-11-20' },
  // Labour-only contract (theka) for the grey structure, shuttering included:
  // Zameen Rs 480-500; contractor Rs 700; Lahore labour-only quotes Rs 450-850.
  { key: 'labour', name: 'Labour', unit: 'sq ft', ratePkr: 580, checked: '2026-11-20' },
  // Conduits, wiring, water supply, drainage and gas pipes with fittings:
  // contractor Rs 265,000 for 2,000 sq ft (~Rs 133); Zameen ~Rs 170.
  { key: 'pipes', name: 'Plumbing and electric pipes', unit: 'sq ft', ratePkr: 150, checked: '2026-11-20' }
]

// Materials the online check reads. All others are always worked out here.
export const LIVE_KEYS = ['cement', 'steel']
export const LOCAL_KEYS = REFERENCE_RATES.map((r) => r.key).filter((k) => !LIVE_KEYS.includes(k))

// How much of the live cement price's move since the reference date the local
// materials follow (0.5 = half), and how far the nudge may go either way.
const MARKET_LINK = 0.5
export const MARKET_LIMITS = { min: 0.8, max: 1.25 }

// cementNow: today's national online cement price, or null.
export function marketFactor(cementNow) {
  const base = REFERENCE_RATES.find((r) => r.key === 'cement').ratePkr
  if (!(cementNow > 0)) return 1
  const f = 1 + MARKET_LINK * (cementNow / base - 1)
  return Math.round(Math.min(MARKET_LIMITS.max, Math.max(MARKET_LIMITS.min, f)) * 1000) / 1000
}

// The automatic national price of one material.
export function estimatedRate(key, market = 1) {
  const ref = REFERENCE_RATES.find((r) => r.key === key)
  if (!ref) return null
  const raw = ref.ratePkr * (LOCAL_KEYS.includes(key) ? market : 1)
  // Whole rupees, or to the nearest 0.5 for a single brick, and to Rs 100 for steel.
  const ratePkr = key === 'bricks' ? Math.round(raw * 2) / 2 : key === 'steel' ? Math.round(raw / 100) * 100 : Math.round(raw)
  return { key, name: ref.name, unit: ref.unit, ratePkr, market }
}
