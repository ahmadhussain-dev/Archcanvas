import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { MaterialRate, RateCheck, User } from '../src/models/index.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'
import { checkRates } from '../src/services/rateUpdater.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'

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
const rate = (key, city) => MaterialRate.findOne({ key, city })

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
    await MaterialRate.insertMany(DEFAULT_RATES.map((r) => ({ ...r, city: 'Faisalabad' })))
    admin = await signUp('admin@example.com', 'admin')
    user = await signUp('user@example.com')
  })
  after(closeTestDatabase)

  test('the 40 cities are public', async () => {
    const res = await request(app).get('/api/rates/cities')
    assert.equal(res.status, 200)
    assert.equal(res.body.cities.length, 40)
    assert.deepEqual(res.body.cities[0], { name: 'Karachi', province: 'Sindh' })
  })

  test('only admins can run a check', async () => {
    assert.equal((await request(app).post('/api/admin/rates/check').set(user)).status, 403)
    assert.equal((await request(app).post('/api/admin/rates/check')).status, 401)
  })

  test('a check gives all 40 cities cement and steel prices, verified, with their source', async () => {
    const res = await request(app).post('/api/admin/rates/check').set(admin)
    assert.equal(res.status, 200)
    const { check } = res.body
    assert.equal(check.trigger, 'admin')
    assert.ok(check.finishedAt)
    assert.deepEqual(check.results.map((r) => [r.key, r.ok]), [['cement', true], ['steel', true]])

    // Every city has every material.
    assert.equal(await MaterialRate.countDocuments(), 40 * DEFAULT_RATES.length)

    const lahore = await rate('cement', 'Lahore')
    assert.equal(lahore.ratePkr, 1475)
    assert.equal(lahore.displayStatus, 'verified')
    assert.equal(lahore.source.origin, 'auto')
    assert.equal(lahore.source.basedOn, 'Lahore')
    assert.equal(lahore.source.url, 'https://icons.com.pk/cement-rate-today')
    assert.equal(lahore.history.at(-1).origin, 'auto')

    const kasur = await rate('cement', 'Kasur')
    assert.equal(kasur.ratePkr, 1475)
    assert.equal(kasur.source.basedOn, 'Lahore')

    // Quetta is not on the cement list, so it borrows Karachi's price.
    assert.equal((await rate('cement', 'Quetta')).source.basedOn, 'Karachi')
    assert.equal((await rate('steel', 'Quetta')).ratePkr, 247000)
    assert.equal((await rate('steel', 'Sialkot')).source.basedOn, 'Gujranwala')

    // Materials no website lists are copied from Faisalabad, still unverified.
    const bricks = await rate('bricks', 'Karachi')
    assert.equal(bricks.ratePkr, DEFAULT_RATES.find((r) => r.key === 'bricks').ratePkr)
    assert.equal(bricks.displayStatus, 'unverified')
    assert.equal(bricks.source.origin, 'seed')
    assert.equal(bricks.source.basedOn, 'Faisalabad')
  })

  test('an estimate shows where each price came from', async () => {
    const res = await request(app).post('/api/estimate').send({ widthFt: 25, depthFt: 45, city: 'kasur' })
    assert.equal(res.status, 200)
    const { estimate } = res.body
    assert.equal(estimate.city, 'Kasur')
    const cement = estimate.lines.find((l) => l.key === 'cement')
    assert.equal(cement.ratePkr, 1475)
    assert.equal(cement.rateStatus, 'verified')
    assert.equal(cement.rateSource.origin, 'auto')
    assert.equal(cement.rateSource.basedOn, 'Lahore')
    assert.ok(cement.rateCheckedAt)
  })

  test('the next day: small changes are saved, a big jump is held for an admin', async () => {
    edit = (url, html) => html.replace('Rs. 1,400 &#8211; 1,550', 'Rs. 1,500 – 1,550').replace('<td>Karachi</td><td>248</td><td>248,000</td>', '<td>Karachi</td><td>480</td><td>480,000</td>')
    const check = await checkRates({ fetchPage, trigger: 'script' })
    const [cement, steel] = check.results
    assert.ok(cement.ok && steel.ok)
    assert.equal((await rate('cement', 'Lahore')).ratePkr, 1525)
    assert.ok(cement.changed >= 1)
    // Karachi steel nearly doubled overnight: kept at yesterday's price.
    assert.ok(steel.held.includes('Karachi'))
    assert.equal((await rate('steel', 'Karachi')).ratePkr, 248000)
    assert.match(steel.message, /held for review/)
  })

  test('an admin saving a held price accepts it, and it is marked as theirs', async () => {
    const karachi = await rate('steel', 'Karachi')
    const res = await request(app).patch(`/api/admin/rates/${karachi.id}`).set(admin).send({ ratePkr: 480000 })
    assert.equal(res.status, 200)
    assert.equal(res.body.rate.source.origin, 'admin')
    // The next check takes the site's price again without holding it.
    await checkRates({ fetchPage, trigger: 'script' })
    const after = await rate('steel', 'Karachi')
    assert.equal(after.ratePkr, 480000)
    assert.equal(after.source.origin, 'auto')
  })

  test('a site that is down or changed keeps the old prices', async () => {
    const before = (await rate('cement', 'Lahore')).ratePkr
    edit = (url, html) => (url.includes('cement') ? '<html><body>New design, no tables</body></html>' : html)
    let check = await checkRates({ fetchPage, trigger: 'script' })
    assert.equal(check.results[0].ok, false)
    assert.match(check.results[0].message, /layout may have changed/)
    assert.equal(check.results[1].ok, true)

    check = await checkRates({ fetchPage: async () => { throw new Error('getaddrinfo ENOTFOUND') }, trigger: 'script' })
    assert.ok(check.results.every((r) => !r.ok))
    assert.match(check.results[0].message, /Could not read the site: getaddrinfo/)
    assert.equal((await rate('cement', 'Lahore')).ratePkr, before)
  })

  test('admins see the latest check', async () => {
    const res = await request(app).get('/api/admin/rates/check').set(admin)
    assert.equal(res.status, 200)
    assert.equal(res.body.check.trigger, 'script')
    assert.equal(await RateCheck.countDocuments(), 5)
  })

  test('two checks at once run only once', async () => {
    edit = (url, html) => html
    const [a, b] = await Promise.all([checkRates({ fetchPage }), checkRates({ fetchPage })])
    assert.equal(a.id, b.id)
  })
})
