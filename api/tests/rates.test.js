import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { MaterialRate, User } from '../src/models/index.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'
import { estimatedRate } from '../src/lib/localPrices.js'
import { NATIONAL } from '../src/lib/cities.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'

const hasDb = await connectTestDatabase('rates')
const app = createApp({ rateLimited: false })

async function signUp(email, role) {
  await request(app).post('/api/auth/register').send({ name: 'Test User', email, password: 'secret123' })
  if (role) await User.updateOne({ email }, { role })
  const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' })
  return { Authorization: `Bearer ${res.body.accessToken}` }
}

describe('rates and estimate', { skip: !hasDb }, () => {
  let admin
  let user

  before(async () => {
    await MaterialRate.insertMany(DEFAULT_RATES.map((r) => ({ ...r, city: NATIONAL })))
    admin = await signUp('admin@example.com', 'admin')
    user = await signUp('user@example.com')
  })
  after(closeTestDatabase)

  test('plot presets are public', async () => {
    const res = await request(app).get('/api/plots/presets')
    assert.equal(res.status, 200)
    assert.equal(res.body.presets.find((p) => p.key === '5-marla').widthFt, 25)
  })

  test('rates are public and start unverified', async () => {
    const res = await request(app).get('/api/rates')
    assert.equal(res.status, 200)
    assert.equal(res.body.rates.length, 7)
    assert.ok(res.body.rates.every((r) => r.displayStatus === 'unverified'))
    assert.equal(res.body.rates[0].history, undefined)
  })

  test('quick estimate without a project', async () => {
    const res = await request(app).post('/api/estimate').send({ widthFt: 25, depthFt: 45, floors: 2 })
    assert.equal(res.status, 200)
    assert.equal(res.body.estimate.coveredAreaSqft, 2250)
    assert.equal(res.body.estimate.city, 'Faisalabad')
    assert.equal((await request(app).post('/api/estimate').send({ widthFt: 25 })).status, 400)
  })

  test('only admins can change prices', async () => {
    const rate = await MaterialRate.findOne({ key: 'cement' })
    assert.equal((await request(app).patch(`/api/admin/rates/${rate.id}`).send({ ratePkr: 1500 })).status, 401)
    assert.equal((await request(app).patch(`/api/admin/rates/${rate.id}`).set(user).send({ ratePkr: 1500 })).status, 403)
    assert.equal((await request(app).get('/api/admin/rates').set(user)).status, 403)
  })

  test('admin price change is verified, logged and used by the estimate', async () => {
    const rate = await MaterialRate.findOne({ key: 'cement' })
    const res = await request(app).patch(`/api/admin/rates/${rate.id}`).set(admin).send({ ratePkr: 1500 })
    assert.equal(res.status, 200)
    assert.equal(res.body.rate.ratePkr, 1500)
    assert.equal(res.body.rate.displayStatus, 'verified')
    assert.equal(res.body.rate.history.length, 1)
    assert.equal(res.body.rate.history[0].ratePkr, 1500)

    const est = await request(app).post('/api/estimate').send({ widthFt: 25, depthFt: 45 })
    const cement = est.body.estimate.lines.find((l) => l.key === 'cement')
    assert.equal(cement.ratePkr, 1500)
    assert.equal(cement.rateStatus, 'verified')

    const unverify = await request(app).patch(`/api/admin/rates/${rate.id}`).set(admin).send({ verified: false })
    assert.equal(unverify.body.rate.displayStatus, 'unverified')
    assert.equal(unverify.body.rate.ratePkr, 1500)
  })

  test('every city uses the national prices; only the percentage differs', async () => {
    const send = (city) => request(app).post('/api/estimate').send({ widthFt: 30, depthFt: 56, floors: 2, city })
    const [karachi, isb, multan] = await Promise.all([send('Karachi'), send('Islamabad'), send('Multan')])
    const k = karachi.body.estimate
    const i = isb.body.estimate
    const m = multan.body.estimate
    assert.equal(k.city, 'Karachi')
    assert.deepEqual(i.lines.map((l) => l.ratePkr), k.lines.map((l) => l.ratePkr))
    assert.equal(k.location.pct, 0)
    assert.equal(i.location.pct, 8)
    assert.equal(m.location.pct, -5)
    assert.ok(i.totalPkr > k.totalPkr && k.totalPkr > m.totalPkr)
    // Old city rows from earlier versions are ignored.
    await MaterialRate.create({ key: 'bricks', name: 'Bricks', unit: 'brick', ratePkr: 99, city: 'Lahore', status: 'verified', verifiedAt: new Date(), source: { origin: 'admin' } })
    const lahore = (await send('Lahore')).body.estimate
    assert.notEqual(lahore.lines.find((l) => l.key === 'bricks').ratePkr, 99)
  })

  test('admins can change a region percentage and put it back', async () => {
    assert.equal((await request(app).patch('/api/admin/rates/regions/potohar').set(user).send({ pct: 12 })).status, 403)
    assert.equal((await request(app).patch('/api/admin/rates/regions/nowhere').set(admin).send({ pct: 12 })).status, 404)
    assert.equal((await request(app).patch('/api/admin/rates/regions/potohar').set(admin).send({ pct: 90 })).status, 400)
    const res = await request(app).patch('/api/admin/rates/regions/potohar').set(admin).send({ pct: 12 })
    assert.equal(res.status, 200)
    assert.equal(res.body.regions.find((r) => r.key === 'potohar').pct, 12)
    const est = await request(app).post('/api/estimate').send({ widthFt: 25, depthFt: 45, city: 'Rawalpindi' })
    assert.equal(est.body.estimate.location.pct, 12)
    const regions = await request(app).get('/api/rates/regions')
    assert.equal(regions.body.regions.find((r) => r.key === 'potohar').defaultPct, 8)
    const reset = await request(app).patch('/api/admin/rates/regions/potohar').set(admin).send({ reset: true })
    assert.equal(reset.body.regions.find((r) => r.key === 'potohar').pct, 8)
  })

  test('an admin price can be dropped to go back to the automatic one', async () => {
    const bricks = await MaterialRate.findOne({ key: 'bricks', city: NATIONAL })
    await request(app).patch(`/api/admin/rates/${bricks.id}`).set(admin).send({ ratePkr: 22 })
    const res = await request(app).patch(`/api/admin/rates/${bricks.id}`).set(admin).send({ automatic: true })
    assert.equal(res.status, 200)
    assert.equal(res.body.rate.ratePkr, estimatedRate('bricks').ratePkr)
    assert.equal(res.body.rate.source.origin, 'estimate')
    assert.equal(res.body.rate.displayStatus, 'estimated')
  })
})
