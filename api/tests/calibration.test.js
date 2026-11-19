// Checks that the automatic prices still land inside the market range each
// city's sources give for a typical 10 Marla double storey grey structure.
// The ranges and their sources are in docs/price-sources.md. When you update
// a reference price or a regional factor, run this to see that no city falls
// out of its range. These ranges are what published guides say on the stated
// dates; they are not an accuracy promise.
import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEstimate } from '../src/lib/estimate.js'
import { REFERENCE_RATES, estimatedRate } from '../src/lib/localPrices.js'

// Rs per sq ft of covered area, grey structure with material and labour.
export const MARKET_RANGES = {
  Lahore: [2800, 3300], // Zameen 2,874 (16 Oct 2026); Glorious 3,000-3,250 (Nov 2026); ACCO 2,800-3,500
  Karachi: [2700, 3100], // Zameen 2,921 (16 Oct 2026); Zell standard 2,700-3,100 (Oct 2026)
  Islamabad: [2950, 3500], // Zameen 3,119 (11 Nov 2026); Avenir 3,500; DBL 2,800-3,500
  Rawalpindi: [2800, 3500], // DBL 2,800-3,300 (Jun 2026); Avenir 3,500
  Faisalabad: [2400, 2900], // DBL 2,400-2,900 (Jun 2026)
  Multan: [2300, 2800] // DBL 2,300-2,800 (Jun 2026)
}

// About 3,360 sq ft covered on two floors, as in Zameen's 10 Marla calculator.
const tenMarla = { widthFt: 30, depthFt: 56, floors: 2, roofHeightFt: 10.5 }

const ratesFor = (city) =>
  Object.fromEntries(REFERENCE_RATES.map((r) => [r.key, { ...estimatedRate(r.key, city), status: 'estimated' }]))

for (const [city, [low, high]] of Object.entries(MARKET_RANGES)) {
  test(`${city}: 10 Marla, 2 floors lands inside the market range`, () => {
    const { perSqftPkr } = calculateEstimate(tenMarla, ratesFor(city))
    assert.ok(perSqftPkr >= low && perSqftPkr <= high, `${city} Rs ${perSqftPkr}/sq ft, market Rs ${low}-${high}`)
  })
}

test('the cost order between cities follows PBS city prices', () => {
  const per = (city) => calculateEstimate(tenMarla, ratesFor(city)).perSqftPkr
  // PBS (Sep 2026): Islamabad dearest, then Lahore, Faisalabad and Karachi close, Hyderabad cheapest.
  assert.ok(per('Islamabad') > per('Lahore'))
  assert.ok(per('Lahore') > per('Faisalabad'))
  assert.ok(per('Faisalabad') > per('Multan'))
  assert.ok(per('Multan') > per('Hyderabad'))
})

test('quantities stay inside Pakistani rules of thumb', () => {
  const est = calculateEstimate(tenMarla, ratesFor('Lahore'))
  const per = Object.fromEntries(est.lines.map((l) => [l.key, l.quantity / est.coveredAreaSqft]))
  assert.ok(per.steel * 1000 >= 1.5 && per.steel * 1000 <= 2.5, 'steel kg per sq ft')
  assert.ok(per.cement >= 0.24 && per.cement <= 0.4, 'cement bags per sq ft')
  assert.ok(per.bricks >= 22 && per.bricks <= 30, 'bricks per sq ft')
  assert.ok(per.sand >= 1.5 && per.sand <= 2.6, 'sand cft per sq ft')
  assert.ok(per.crush >= 0.7 && per.crush <= 1.1, 'crush cft per sq ft')
})
