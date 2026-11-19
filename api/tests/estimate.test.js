import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEstimate, EXTRAS, RANGE } from '../src/lib/estimate.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'

const rates = Object.fromEntries(DEFAULT_RATES.map((r) => [r.key, { ...r, status: 'estimated' }]))
const fiveMarlaTwoFloors = { widthFt: 25, depthFt: 45, floors: 2, roofHeightFt: 10.5 }
const amount = (est, key) => [...est.lines, ...est.extras].find((l) => l.key === key).amountPkr

test('5 Marla, 2 floors, standard roof', () => {
  const est = calculateEstimate(fiveMarlaTwoFloors, rates)
  assert.equal(est.coveredAreaSqft, 2250)
  const qty = Object.fromEntries(est.lines.map((l) => [l.key, l.quantity]))
  assert.deepEqual(qty, { steel: 7.88, cement: 990, bricks: 51750, sand: 4275, crush: 2475, labour: 2250, pipes: 2250 })
  const all = [...est.lines, ...est.extras]
  assert.equal(est.totalPkr, all.reduce((s, l) => s + l.amountPkr, 0))
  assert.equal(est.perSqftPkr, Math.round(est.totalPkr / 2250))
  assert.equal(est.hasUnverifiedRates, false)
  assert.equal(est.checkedSharePct, 0)
  assert.deepEqual(est.missingRates, [])
})

test('extra lines: groundwork, frames, tanks, wastage, transport and contingency', () => {
  const est = calculateEstimate(fiveMarlaTwoFloors, rates)
  assert.deepEqual(est.extras.map((x) => x.key), ['groundwork', 'frames', 'tanks', 'wastage', 'transport', 'contingency'])
  // Groundwork is for the footprint only, not both floors.
  assert.equal(amount(est, 'groundwork'), 25 * 45 * EXTRAS.groundworkPerFootprintSqft)
  assert.equal(amount(est, 'tanks'), EXTRAS.tanksPerHouse)
  const materials = est.lines.filter((l) => l.key !== 'labour').reduce((s, l) => s + l.amountPkr, 0)
  assert.equal(amount(est, 'wastage'), Math.round(materials * EXTRAS.wastage))
  const beforeContingency = est.totalPkr - amount(est, 'contingency')
  assert.ok(Math.abs(amount(est, 'contingency') - beforeContingency * EXTRAS.contingency) <= 1)
})

test('low, likely and high', () => {
  const est = calculateEstimate(fiveMarlaTwoFloors, rates)
  assert.equal(est.range.lowPkr, Math.round(est.totalPkr * RANGE.low))
  assert.equal(est.range.highPkr, Math.round(est.totalPkr * RANGE.high))
  assert.ok(est.range.lowPerSqftPkr < est.perSqftPkr && est.perSqftPkr < est.range.highPerSqftPkr)
})

test('share of money on prices checked online', () => {
  const live = { ...rates, steel: { ...rates.steel, status: 'verified' }, cement: { ...rates.cement, status: 'verified' } }
  const est = calculateEstimate(fiveMarlaTwoFloors, live)
  const lines = est.lines.reduce((s, l) => s + l.amountPkr, 0)
  assert.equal(est.checkedSharePct, Math.round(((amount(est, 'steel') + amount(est, 'cement')) / lines) * 100))
})

test('cost grows with floors and roof height', () => {
  const one = calculateEstimate({ ...fiveMarlaTwoFloors, floors: 1 }, rates)
  const two = calculateEstimate(fiveMarlaTwoFloors, rates)
  const tall = calculateEstimate({ ...fiveMarlaTwoFloors, roofHeightFt: 12 }, rates)
  assert.ok(two.totalPkr > one.totalPkr * 1.7)
  assert.ok(tall.totalPkr > two.totalPkr)
  const bricks = (e) => e.lines.find((l) => l.key === 'bricks').quantity
  const steel = (e) => e.lines.find((l) => l.key === 'steel').quantity
  assert.equal(bricks(tall), Math.round(51750 * 12 / 10.5))
  assert.equal(steel(tall), steel(two))
})

test('missing rates are reported, not guessed', () => {
  const { steel, ...rest } = rates
  const est = calculateEstimate(fiveMarlaTwoFloors, rest)
  assert.deepEqual(est.missingRates, ['steel'])
  assert.equal(est.lines.length, 6)
})
