import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { readTables, parsePrice, median, decodeEntities } from '../src/lib/priceTables.js'
import { RATE_SOURCES } from '../src/services/rateSources.js'
import { priceForCity, checkIsDue, CHECK_EVERY_MS, RETRY_AFTER_MS } from '../src/services/rateUpdater.js'
import { CITIES, CITY_NAMES, findCity } from '../src/lib/cities.js'

const page = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
const source = (key) => RATE_SOURCES.find((s) => s.key === key)

describe('reading price tables', () => {
  test('prices, ranges and entities', () => {
    assert.equal(parsePrice('1,565'), 1565)
    assert.equal(parsePrice('Rs. 1,400 – 1,550'), 1475)
    assert.equal(parsePrice('PKR 1,560 (50kg)'), 1560)
    assert.equal(parsePrice('N/A'), null)
    assert.equal(decodeEntities('Rs.&nbsp;1&#8211;2 &amp; 3'), 'Rs. 1–2 & 3')
    assert.equal(median([3, 1, 2]), 2)
    assert.equal(median([4, 1, 2, 3]), 2.5)
  })

  test('tables inside scripts and comments are ignored', async () => {
    const tables = readTables(await page('cement-rate-page.html'))
    assert.equal(tables.length, 2)
    assert.ok(!JSON.stringify(tables).includes('Nowhere'))
    assert.ok(!JSON.stringify(tables).includes('Old price'))
  })

  test('cement page: city prices and a Pakistan average', async () => {
    const { byCity, national } = source('cement').parse(await page('cement-rate-page.html'))
    assert.equal(byCity.Lahore, 1475)
    assert.equal(byCity.Karachi, 1425)
    assert.equal(byCity.Faisalabad, 1375)
    assert.equal(Object.keys(byCity).length, 7)
    assert.ok(national > 1300 && national < 1500)
  })

  test('cement page without a city table falls back to the brand table', async () => {
    const html = (await page('cement-rate-page.html')).replace(/<h2>Cement Price Comparison[\s\S]*<\/figure>/, '')
    const { byCity, national } = source('cement').parse(html)
    assert.equal(byCity, null)
    // Median of the brand prices; the 650 bond and 2,350 white cement are only two of six.
    assert.equal(national, 1572.5)
  })

  test('steel page: per ton column, not per kg', async () => {
    const { byCity, national } = source('steel').parse(await page('steel-rate-page.html'))
    assert.equal(byCity.Lahore, 246000)
    assert.equal(byCity.Quetta, 247000)
    assert.equal(national, 246000)
  })

  test('steel page with only a per kg city column', () => {
    const html = '<table><tr><th>City</th><th>Rate (PKR/KG)</th></tr><tr><td>Lahore</td><td>250</td></tr></table>'
    assert.deepEqual(source('steel').parse(html).byCity, { Lahore: 250000 })
  })

  test('a page with no tables gives nothing', () => {
    const { byCity, national } = source('cement').parse('<html><body>Down for maintenance</body></html>')
    assert.equal(byCity, null)
    assert.equal(national, null)
  })
})

describe('cities', () => {
  test('40 cities, each named once, each borrowing from a city', () => {
    assert.equal(CITIES.length, 40)
    assert.equal(new Set(CITY_NAMES).size, 40)
    for (const city of CITIES) assert.ok(city.near.length > 0 && city.near.every((n) => findCity(n)), city.name)
    assert.equal(findCity(' lahore ').name, 'Lahore')
    assert.equal(findCity('Atlantis'), null)
  })

  test('a city uses its own price, then the nearest listed city, then the average', () => {
    const bounds = { min: 500, max: 5000 }
    const parsed = { byCity: { Lahore: 1475, 'Karachi ': 1425, 'Islamabad/Rawalpindi': 1390, Multan: 40 }, national: 1400 }
    assert.deepEqual(priceForCity(findCity('Lahore'), parsed, bounds), { value: 1475, basedOn: 'Lahore' })
    assert.deepEqual(priceForCity(findCity('Kasur'), parsed, bounds), { value: 1475, basedOn: 'Lahore' })
    assert.deepEqual(priceForCity(findCity('Hyderabad'), parsed, bounds), { value: 1425, basedOn: 'Karachi' })
    assert.deepEqual(priceForCity(findCity('Rawalpindi'), parsed, bounds), { value: 1390, basedOn: 'Rawalpindi' })
    // Multan's 40 is outside the plausible range, so it is not used.
    assert.deepEqual(priceForCity(findCity('Bahawalpur'), parsed, bounds), { value: 1400, basedOn: 'Pakistan average' })
    assert.equal(priceForCity(findCity('Bahawalpur'), { byCity: null, national: null }, bounds), null)
  })

  test('a check is due daily, or a few hours after a failure', () => {
    const now = Date.now()
    const run = (ago, ok) => ({ startedAt: new Date(now - ago), finishedAt: new Date(now - ago), results: [{ ok: true }, { ok }] })
    assert.equal(checkIsDue(null, now), true)
    assert.equal(checkIsDue(run(CHECK_EVERY_MS - 60_000, true), now), false)
    assert.equal(checkIsDue(run(CHECK_EVERY_MS + 60_000, true), now), true)
    assert.equal(checkIsDue(run(RETRY_AFTER_MS - 60_000, false), now), false)
    assert.equal(checkIsDue(run(RETRY_AFTER_MS + 60_000, false), now), true)
  })
})
