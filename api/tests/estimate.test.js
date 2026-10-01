import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEstimate } from '../src/lib/estimate.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'

const rates = Object.fromEntries(DEFAULT_RATES.map((r) => [r.key, { ...r, status: 'unverified' }]))
const fiveMarlaTwoFloors = { widthFt: 25, depthFt: 45, floors: 2, roofHeightFt: 10.5 }

test('5 Marla, 2 floors, standard roof', () => {
  const est = calculateEstimate(fiveMarlaTwoFloors, rates)
  assert.equal(est.coveredAreaSqft, 2250)
  const qty = Object.fromEntries(est.lines.map((l) => [l.key, l.quantity]))
  assert.deepEqual(qty, { steel: 7.88, cement: 900, bricks: 49500, sand: 4050, crush: 2025, labour: 2250, pipes: 2250 })
  assert.equal(est.totalPkr, est.lines.reduce((s, l) => s + l.amountPkr, 0))
  assert.equal(est.perSqftPkr, Math.round(est.totalPkr / 2250))
  assert.equal(est.hasUnverifiedRates, true)
  assert.deepEqual(est.missingRates, [])
})

test('cost grows with floors and roof height', () => {
  const one = calculateEstimate({ ...fiveMarlaTwoFloors, floors: 1 }, rates)
  const two = calculateEstimate(fiveMarlaTwoFloors, rates)
  const tall = calculateEstimate({ ...fiveMarlaTwoFloors, roofHeightFt: 12 }, rates)
  assert.ok(Math.abs(two.totalPkr - 2 * one.totalPkr) <= 7)
  assert.ok(tall.totalPkr > two.totalPkr)
  const bricks = (e) => e.lines.find((l) => l.key === 'bricks').quantity
  const steel = (e) => e.lines.find((l) => l.key === 'steel').quantity
  assert.equal(bricks(tall), Math.round(49500 * 12 / 10.5))
  assert.equal(steel(tall), steel(two))
})

test('missing rates are reported, not guessed', () => {
  const { steel, ...rest } = rates
  const est = calculateEstimate(fiveMarlaTwoFloors, rest)
  assert.deepEqual(est.missingRates, ['steel'])
  assert.equal(est.lines.length, 6)
})
