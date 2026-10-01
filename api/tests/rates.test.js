import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { MaterialRate, User } from '../src/models/index.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'
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
    await MaterialRate.insertMany(DEFAULT_RATES.map((r) => ({ ...r, city: 'Faisalabad' })))
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

  test('another city falls back to Faisalabad rates', async () => {
    await MaterialRate.create({ key: 'bricks', name: 'Bricks', unit: 'brick', ratePkr: 20, city: 'Lahore' })
    const res = await request(app).post('/api/estimate').send({ widthFt: 25, depthFt: 45, city: 'Lahore' })
    const lines = Object.fromEntries(res.body.estimate.lines.map((l) => [l.key, l.ratePkr]))
    assert.equal(lines.bricks, 20)
    assert.equal(lines.cement, 1500)
  })
})
