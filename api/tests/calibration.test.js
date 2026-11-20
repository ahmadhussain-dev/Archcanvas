// Checks the national rates and the city percentages against what published
// sources and a real contractor's quote say. The figures and their sources
// are in docs/price-sources.md. When you change a reference price, a quantity
// or a region percentage, run this to see nothing falls out of range. These
// are published figures on the stated dates; they are not an accuracy promise.
import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEstimate } from '../src/lib/estimate.js'
import { REFERENCE_RATES, estimatedRate } from '../src/lib/localPrices.js'
import { adjustmentFor } from '../src/lib/cityAdjustments.js'

const rates = Object.fromEntries(REFERENCE_RATES.map((r) => [r.key, { ...estimatedRate(r.key), status: 'estimated' }]))
const estimate = (plot, city) => calculateEstimate({ roofHeightFt: 10.5, floors: 2, ...plot }, rates, city ? { ...adjustmentFor(city), city } : null)

// Milkiyat, House construction cost in Pakistan 2026, grey structure, double
// storey: [covered sq ft low, high], [PKR low, high]. The 8 Marla covered area
// is not given there; 2,500-2,900 sq ft is typical.
const MILKIYAT = {
  '5 Marla': { area: [1900, 2200], pkr: [5_600_000, 9_000_000] },
  '8 Marla': { area: [2500, 2900], pkr: [7_600_000, 9_800_000] },
  '10 Marla': { area: [3200, 4000], pkr: [9_500_000, 12_000_000] }
}
// A plot 30 ft wide, as deep as it needs to be for the covered area.
const plotFor = (area) => ({ widthFt: 30, depthFt: area / 60 })

for (const [size, { area, pkr }] of Object.entries(MILKIYAT)) {
  test(`${size}: the likely figure lands inside Milkiyat's grey structure range`, () => {
    const mid = (area[0] + area[1]) / 2
    const est = estimate(plotFor(mid))
    assert.ok(est.totalPkr >= pkr[0] && est.totalPkr <= pkr[1], `${size} ${mid} sq ft: Rs ${est.totalPkr}, Milkiyat ${pkr[0]}-${pkr[1]}`)
  })

  test(`${size}: our low-high range covers most of Milkiyat's`, () => {
    const low = estimate(plotFor(area[0])).range.lowPkr
    const high = estimate(plotFor(area[1])).range.highPkr
    const overlap = Math.min(high, pkr[1]) - Math.max(low, pkr[0])
    // Milkiyat's 5 Marla top (PKR 90 lakh, ~Rs 4,700/sq ft) is a premium build
    // above our "complex design" end, so three quarters is the bar.
    assert.ok(overlap / (pkr[1] - pkr[0]) >= 0.75, `${size}: ours ${low}-${high}, Milkiyat ${pkr[0]}-${pkr[1]}`)
  })
}

// A contractor's 5 Marla grey structure quote (25 x 45 plot, 2,000 sq ft
// covered, double storey, A+ materials, 20 Oct 2026): Rs 5,554,200. It has no
// tanks, wastage, transport or contingency lines, so compare without them.
test('5 Marla: close to a real contractor quote, like for like', () => {
  const est = estimate({ widthFt: 25, depthFt: 40 })
  const notInQuote = ['tanks', 'wastage', 'transport', 'contingency']
  const comparable = est.totalPkr - est.extras.filter((x) => notInQuote.includes(x.key)).reduce((s, x) => s + x.amountPkr, 0)
  const diff = comparable / 5_554_200 - 1
  assert.ok(Math.abs(diff) <= 0.1, `ours Rs ${comparable}, contractor Rs 5,554,200 (${Math.round(diff * 100)}%)`)
  // And the full quote sits inside our range.
  assert.ok(est.range.lowPkr <= 5_554_200 && 5_554_200 <= est.range.highPkr)
})

// Rs per sq ft, 10 Marla double storey grey structure with material and labour.
export const CITY_RANGES = {
  Lahore: [2800, 3300], // Zameen 2,874 (16 Oct 2026); Glorious 3,000-3,250 (Nov 2026); ACCO 2,800-3,500
  Karachi: [2700, 3100], // Zameen 2,921 (16 Oct 2026); Zell standard 2,700-3,100 (Oct 2026)
  Islamabad: [2950, 3500], // Zameen 3,119 (11 Nov 2026); Avenir 3,500; DBL 2,800-3,500
  Rawalpindi: [2800, 3500], // DBL 2,800-3,300 (Jun 2026); Avenir 3,500
  Faisalabad: [2400, 2900], // DBL 2,400-2,900 (Jun 2026)
  Multan: [2300, 2800] // DBL 2,300-2,800 (Jun 2026)
}

// About 3,360 sq ft covered on two floors, as in Zameen's 10 Marla calculator.
const tenMarla = { widthFt: 30, depthFt: 56 }

for (const [city, [low, high]] of Object.entries(CITY_RANGES)) {
  test(`${city}: national rates plus the city percentage land inside the market range`, () => {
    const { perSqftPkr } = estimate(tenMarla, city)
    assert.ok(perSqftPkr >= low && perSqftPkr <= high, `${city} Rs ${perSqftPkr}/sq ft, market Rs ${low}-${high}`)
  })
}

test('the cost order between cities follows PBS city prices', () => {
  const per = (city) => estimate(tenMarla, city).perSqftPkr
  assert.ok(per('Islamabad') > per('Lahore'))
  assert.ok(per('Lahore') > per('Faisalabad'))
  assert.ok(per('Faisalabad') > per('Multan'))
  assert.ok(per('Multan') > per('Hyderabad'))
})

test('quantities stay inside Pakistani rules of thumb', () => {
  const est = estimate(tenMarla)
  const per = Object.fromEntries(est.lines.map((l) => [l.key, l.quantity / est.coveredAreaSqft]))
  assert.ok(per.steel * 1000 >= 1.25 && per.steel * 1000 <= 1.8, 'steel kg per sq ft')
  assert.ok(per.cement >= 0.22 && per.cement <= 0.35, 'cement bags per sq ft')
  assert.ok(per.bricks >= 26 && per.bricks <= 30, 'bricks per sq ft')
  assert.ok(per.sand >= 1 && per.sand <= 2.5, 'sand cft per sq ft')
  assert.ok(per.crush >= 0.75 && per.crush <= 0.95, 'crush cft per sq ft')
})
