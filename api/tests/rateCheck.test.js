import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { MaterialRate, RateCheck, User } from '../src/models/index.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'
import { estimatedRate } from '../src/lib/localPrices.js'
import { NATIONAL } from '../src/lib/cities.js'
import { checkRates, nationalPrice } from '../src/services/rateUpdater.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'

test('the national price is the page figure, or the middle of its cities', () => {
  const bounds = { min: 500, max: 5000 }
  assert.equal(nationalPrice({ national: 1500.4, byCity: { Lahore: 1600 } }, bounds), 1500)
  assert.equal(nationalPrice({ national: null, byCity: { Lahore: 1600, Karachi: 1400, Multan: 1500, Typo: 15 } }, bounds), 1500)
  assert.equal(nationalPrice({ national: null, byCity: null }, bounds), null)
})

const hasDb = await connectTestDatabase('ratecheck')
const pages = {
  'https://icons.com.pk/cement-rate-today': await readFile(new URL('./fixtures/cement-rate-page.html', import.meta.url), 'utf8'),
  'https://icons.com.pk/steel-rate-today': await readFile(new URL('./fixtures/steel-rate-page.html', import.meta.url), 'utf8')
}
// Saved pages instead of the internet. `edit` changes a page for one test.
let edit = (url, html) => html
const fetchPage = async (url) => {
  if (!pages[url]) throw new Error('The site answered 404')
  return edit(url, pages[url])
}
const app = createApp({ rateLimited: false, fetchPage })
const rate = (key) => MaterialRate.findOne({ key, city: NATIONAL })
// Every price on the steel page's city table times `factor`.
const steelTimes = (factor) => (url, html) => {
  if (!url.includes('steel')) return html
  const [head, cities] = html.split('Major Cities')
  return `${head}Major Cities${cities.replace(/<td>(\d{3})<\/td><td>(\d{3}),000<\/td>/g, (m, kg, ton) => `<td>${Math.round(kg * factor)}</td><td>${Math.round(ton * factor)},000</td>`)}`
}

async function signUp(email, role) {
  await request(app).post('/api/auth/register').send({ name: 'Test User', email, password: 'secret123' })
  if (role) await User.updateOne({ email }, { role })
  const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' })
  return { Authorization: `Bearer ${res.body.accessToken}` }
}

describe('daily online price check', { skip: !hasDb }, () => {
  let admin
  let user

  before(async () => {
    admin = await signUp('admin@example.com', 'admin')
    user = await signUp('user@example.com')
  })
  after(closeTestDatabase)

  test('the 40 cities are public, each with its region percentage', async () => {
    const res = await request(app).get('/api/rates/cities')
    assert.equal(res.status, 200)
    assert.equal(res.body.cities.length, 40)
    assert.deepEqual(res.body.cities[0], { name: 'Karachi', province: 'Sindh', region: 'karachi', adjustmentPct: 0 })
  })

  test('only admins can run a check', async () => {
    assert.equal((await request(app).post('/api/admin/rates/check').set(user)).status, 403)
    assert.equal((await request(app).post('/api/admin/rates/check')).status, 401)
  })

  test('a check saves one national cement and steel price, verified, with its source', async () => {
    const res = await request(app).post('/api/admin/rates/check').set(admin)
    assert.equal(res.status, 200)
    const { check } = res.body
    assert.equal(check.trigger, 'admin')
    assert.ok(check.finishedAt)
    assert.deepEqual(check.results.map((r) => [r.key, r.ok]), [['cement', true], ['steel', true], ['national', true]])

    // One national row per material, no city rows.
    assert.equal(await MaterialRate.countDocuments(), DEFAULT_RATES.length)
    assert.equal(await MaterialRate.countDocuments({ city: NATIONAL }), DEFAULT_RATES.length)

    const cement = await rate('cement')
    assert.equal(cement.ratePkr, 1386)
    assert.equal(cement.displayStatus, 'verified')
    assert.equal(cement.source.origin, 'auto')
    assert.equal(cement.source.basedOn, 'Pakistan average')
    assert.equal(cement.source.url, 'https://icons.com.pk/cement-rate-today')
    assert.equal(cement.history.at(-1).origin, 'auto')
    assert.equal((await rate('steel')).ratePkr, 246000)
    assert.match(check.results[0].message, /Pakistan price Rs 1,386/)

    // Materials no website lists are worked out, nudged by today's cement price.
    const bricks = await rate('bricks')
    assert.equal(bricks.ratePkr, estimatedRate('bricks', bricks.source.market).ratePkr)
    assert.ok(bricks.source.market < 1)
    assert.equal(bricks.displayStatus, 'estimated')
    assert.equal(bricks.source.origin, 'estimate')
    assert.equal(await MaterialRate.countDocuments({ status: { $ne: 'verified' } }), 0)
  })

  test('an estimate uses the national prices and shows where each came from', async () => {
    const res = await request(app).post('/api/estimate').send({ widthFt: 25, depthFt: 45, city: 'kasur' })
    assert.equal(res.status, 200)
    const { estimate } = res.body
    assert.equal(estimate.city, 'Kasur')
    const cement = estimate.lines.find((l) => l.key === 'cement')
    assert.equal(cement.ratePkr, 1386)
    assert.equal(cement.rateStatus, 'verified')
    assert.equal(cement.rateSource.origin, 'auto')
    assert.ok(cement.rateCheckedAt)
    // Kasur is in the Lahore region: +2% on the whole estimate.
    assert.equal(estimate.location.pct, 2)
    assert.ok(estimate.extras.some((x) => x.key === 'location'))
  })

  test('the next day: small changes are saved, a big jump waits one check', async () => {
    edit = (url, html) => steelTimes(1.9)(url, html.replace('Rs.&nbsp;1,370 – 1,380', 'Rs.&nbsp;1,390 – 1,400'))
    const check = await checkRates({ fetchPage, trigger: 'script' })
    const [cement, steel] = check.results
    assert.ok(cement.ok && steel.ok)
    // Faisalabad's small rise moves the middle of the list to Rs 1,395.
    assert.equal((await rate('cement')).ratePkr, 1395)
    // Steel nearly doubled overnight: kept at yesterday's price for now.
    assert.deepEqual(steel.held, [NATIONAL])
    const s = await rate('steel')
    assert.equal(s.ratePkr, 246000)
    assert.ok(s.pending.ratePkr > 400000)
    assert.match(steel.message, /waiting for the next check/)
    // Local materials follow the live cement price a little.
    const national = check.results[2]
    assert.equal(national.key, 'national')
    const bricks = await rate('bricks')
    assert.equal(bricks.ratePkr, estimatedRate('bricks', bricks.source.market).ratePkr)
    assert.match(national.message, /national prices worked out/)
  })

  test('the next check sees the same price and accepts it, with no admin step', async () => {
    const check = await checkRates({ fetchPage, trigger: 'script' })
    assert.deepEqual(check.results[1].held, [])
    const s = await rate('steel')
    assert.ok(s.ratePkr > 400000)
    assert.equal(s.source.origin, 'auto')
    assert.equal(s.pending?.ratePkr, undefined)
  })

  test('an admin price is an optional override the check keeps', async () => {
    edit = (url, html) => html
    const steel = await rate('steel')
    const res = await request(app).patch(`/api/admin/rates/${steel.id}`).set(admin).send({ ratePkr: 300000 })
    assert.equal(res.status, 200)
    assert.equal(res.body.rate.source.origin, 'admin')
    const bricks = await rate('bricks')
    await request(app).patch(`/api/admin/rates/${bricks.id}`).set(admin).send({ ratePkr: 19 })
    let check = await checkRates({ fetchPage, trigger: 'script' })
    assert.match(check.results[1].message, /admin price is kept/)
    assert.equal((await rate('steel')).ratePkr, 300000)
    assert.equal((await rate('bricks')).ratePkr, 19)
    // Back to automatic: the next check puts the online price back.
    await request(app).patch(`/api/admin/rates/${steel.id}`).set(admin).send({ automatic: true })
    check = await checkRates({ fetchPage, trigger: 'script' })
    const after = await rate('steel')
    assert.equal(after.source.origin, 'auto')
    assert.ok(after.ratePkr > 0)
  })

  test('a site that is down or changed keeps the old prices', async () => {
    const before = (await rate('cement')).ratePkr
    edit = (url, html) => (url.includes('cement') ? '<html><body>New design, no tables</body></html>' : html)
    let check = await checkRates({ fetchPage, trigger: 'script' })
    assert.equal(check.results[0].ok, false)
    assert.match(check.results[0].message, /layout may have changed/)
    assert.equal(check.results[1].ok, true)

    check = await checkRates({ fetchPage: async () => { throw new Error('getaddrinfo ENOTFOUND') }, trigger: 'script' })
    assert.ok(check.results.slice(0, 2).every((r) => !r.ok))
    assert.equal(check.results[2].ok, true)
    assert.match(check.results[0].message, /Could not read the site: getaddrinfo/)
    assert.equal((await rate('cement')).ratePkr, before)
  })

  test('admins see the latest check', async () => {
    const res = await request(app).get('/api/admin/rates/check').set(admin)
    assert.equal(res.status, 200)
    assert.equal(res.body.check.trigger, 'script')
    assert.equal(await RateCheck.countDocuments(), 7)
  })

  test('when the site has been down for over 30 days, cement falls back to the national reference', async () => {
    const old = new Date(Date.now() - 31 * 86_400_000)
    await MaterialRate.updateMany({ key: 'cement', 'source.origin': 'auto' }, { verifiedAt: old })
    await checkRates({ fetchPage: async () => { throw new Error('getaddrinfo ENOTFOUND') }, trigger: 'script' })
    const cement = await rate('cement')
    assert.equal(cement.source.origin, 'estimate')
    assert.equal(cement.displayStatus, 'estimated')
    assert.equal(cement.ratePkr, estimatedRate('cement').ratePkr)
  })

  test('two checks at once run only once', async () => {
    edit = (url, html) => html
    const [a, b] = await Promise.all([checkRates({ fetchPage }), checkRates({ fetchPage })])
    assert.equal(a.id, b.id)
  })
})
