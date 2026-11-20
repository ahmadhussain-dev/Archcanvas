import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES } from '../src/lib/cities.js'
import { LOCAL_KEYS, REFERENCE_RATES, estimatedRate, marketFactor, MARKET_LIMITS } from '../src/lib/localPrices.js'
import { REGIONS, adjustmentFor, regionOf, regionTable, ADJUSTMENT_LIMITS } from '../src/lib/cityAdjustments.js'

test('one national price for every material', () => {
  for (const { key, ratePkr } of REFERENCE_RATES) assert.equal(estimatedRate(key).ratePkr, ratePkr, key)
})

test('cities fall in the right region', () => {
  assert.equal(regionOf('Karachi'), 'karachi')
  assert.equal(regionOf('islamabad'), 'potohar')
  assert.equal(regionOf('Multan'), 'south-punjab')
  assert.equal(regionOf('Peshawar'), 'kp')
  assert.equal(regionOf('Quetta'), 'balochistan')
  assert.equal(regionOf('Faisalabad'), 'central-punjab')
  assert.equal(regionOf('Lahore'), 'lahore')
  assert.equal(regionOf('Somewhere new'), 'central-punjab')
})

test('each region is one simple percentage, Islamabad dearest and Sindh cheapest', () => {
  assert.equal(adjustmentFor('Islamabad').pct, 8)
  assert.equal(adjustmentFor('Karachi').pct, 0)
  assert.equal(adjustmentFor('Hyderabad').pct, -10)
  for (const r of REGIONS) assert.ok(r.pct >= ADJUSTMENT_LIMITS.min && r.pct <= ADJUSTMENT_LIMITS.max, r.key)
})

test("an admin's percentage replaces the default", () => {
  const a = adjustmentFor('Multan', { 'south-punjab': -8 })
  assert.equal(a.pct, -8)
  assert.equal(a.isDefault, false)
  const table = regionTable({ 'south-punjab': -8 })
  const south = table.find((r) => r.key === 'south-punjab')
  assert.equal(south.pct, -8)
  assert.equal(south.defaultPct, -5)
  // Every one of the 40 cities is listed under exactly one region.
  assert.equal(table.reduce((n, r) => n + r.cities.length, 0), CITIES.length)
})

test('the live cement price nudges local materials, within limits', () => {
  const base = REFERENCE_RATES.find((r) => r.key === 'cement').ratePkr
  assert.equal(marketFactor(null), 1)
  assert.equal(marketFactor(base), 1)
  assert.equal(marketFactor(base * 1.1), 1.05) // cement +10% => local +5%
  assert.equal(marketFactor(100000), MARKET_LIMITS.max)
  assert.equal(marketFactor(1), MARKET_LIMITS.min)
  for (const key of LOCAL_KEYS) assert.ok(estimatedRate(key, 1.1).ratePkr >= estimatedRate(key).ratePkr)
  // Cement and steel themselves are not nudged by their own index.
  assert.equal(estimatedRate('cement', 1.2).ratePkr, estimatedRate('cement').ratePkr)
})

test('every reference price says when it was checked', () => {
  for (const r of REFERENCE_RATES) assert.match(r.checked, /^\d{4}-\d{2}-\d{2}$/, r.key)
})
