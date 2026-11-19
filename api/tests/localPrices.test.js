import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES } from '../src/lib/cities.js'
import { LOCAL_KEYS, REFERENCE_RATES, estimatedRate, marketFactor, regionOf, MARKET_LIMITS } from '../src/lib/localPrices.js'

test('every one of the 40 cities gets a price for every material', () => {
  for (const city of CITIES) {
    for (const { key } of REFERENCE_RATES) {
      const r = estimatedRate(key, city.name)
      assert.ok(r.ratePkr > 0, `${city.name} ${key}`)
    }
  }
})

test('cities fall in the right region', () => {
  assert.equal(regionOf('Karachi'), 'karachi')
  assert.equal(regionOf('islamabad'), 'potohar')
  assert.equal(regionOf('Multan'), 'south-punjab')
  assert.equal(regionOf('Peshawar'), 'kp')
  assert.equal(regionOf('Quetta'), 'balochistan')
  assert.equal(regionOf('Faisalabad'), 'central-punjab')
  assert.equal(regionOf('Somewhere new'), 'central-punjab')
})

test('regional differences: Islamabad bricks dearer, Karachi sand cheaper', () => {
  assert.equal(estimatedRate('bricks', 'Faisalabad').ratePkr, 17)
  assert.ok(estimatedRate('bricks', 'Islamabad').ratePkr > 20)
  assert.ok(estimatedRate('sand', 'Karachi').ratePkr < estimatedRate('sand', 'Lahore').ratePkr)
  assert.ok(estimatedRate('labour', 'Karachi').ratePkr > estimatedRate('labour', 'Peshawar').ratePkr)
})

test('the live cement price nudges local materials, within limits', () => {
  assert.equal(marketFactor(null), 1)
  assert.equal(marketFactor(1450), 1)
  assert.equal(marketFactor(1595), 1.05) // cement +10% => local +5%
  assert.equal(marketFactor(100000), MARKET_LIMITS.max)
  assert.equal(marketFactor(1), MARKET_LIMITS.min)
  for (const key of LOCAL_KEYS) assert.ok(estimatedRate(key, 'Lahore', 1.1).ratePkr >= estimatedRate(key, 'Lahore').ratePkr)
  // Cement and steel themselves are not nudged by their own index.
  assert.equal(estimatedRate('cement', 'Lahore', 1.2).ratePkr, 1450)
})
