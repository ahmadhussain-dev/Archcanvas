import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { User } from '../src/models/index.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'

const hasDb = await connectTestDatabase('auth')
const app = createApp({ rateLimited: false })
const account = { name: 'Ahmad Hussain', email: 'Ahmad@Example.com', password: 'secret123' }

function refreshCookie(res) {
  return res.headers['set-cookie']?.find((c) => c.startsWith('ac_refresh='))
}

describe('auth', { skip: !hasDb }, () => {
  after(closeTestDatabase)

  let cookie
  let accessToken

  test('register creates a user and starts a session', async () => {
    const res = await request(app).post('/api/auth/register').send(account)
    assert.equal(res.status, 201)
    assert.equal(res.body.user.email, 'ahmad@example.com')
    assert.equal(res.body.user.role, 'user')
    assert.equal(res.body.user.passwordHash, undefined)
    assert.ok(res.body.accessToken)
    cookie = refreshCookie(res)
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /Path=\/api\/auth/)
    assert.match(cookie, /SameSite=Lax/)

    const stored = await User.findOne({ email: 'ahmad@example.com' }).select('+passwordHash')
    assert.match(stored.passwordHash, /^\$2[aby]\$12\$/)
  })

  test('register rejects a duplicate email and weak passwords', async () => {
    const dup = await request(app).post('/api/auth/register').send(account)
    assert.equal(dup.status, 409)

    const weak = await request(app).post('/api/auth/register').send({ ...account, email: 'b@example.com', password: 'abcdefgh' })
    assert.equal(weak.status, 400)
    assert.equal(weak.body.error, 'Password must contain a number')

    const badEmail = await request(app).post('/api/auth/register').send({ ...account, email: 'nope' })
    assert.equal(badEmail.status, 400)
    assert.equal(badEmail.body.details[0].field, 'email')
  })

  test('login returns a session; wrong password and unknown email look the same', async () => {
    const ok = await request(app).post('/api/auth/login').send({ email: 'AHMAD@example.com', password: 'secret123' })
    assert.equal(ok.status, 200)
    accessToken = ok.body.accessToken
    cookie = refreshCookie(ok)

    const wrong = await request(app).post('/api/auth/login').send({ email: account.email, password: 'wrong1234' })
    const unknown = await request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'wrong1234' })
    assert.equal(wrong.status, 401)
    assert.equal(unknown.status, 401)
    assert.equal(wrong.body.error, unknown.body.error)
  })

  test('me needs a valid access token', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401)
    assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer junk')).status, 401)
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)
    assert.equal(res.status, 200)
    assert.equal(res.body.user.name, 'Ahmad Hussain')
  })

  test('refresh swaps the cookie for a new access token', async () => {
    assert.equal((await request(app).post('/api/auth/refresh')).status, 401)
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie)
    assert.equal(res.status, 200)
    assert.ok(res.body.accessToken)
    assert.ok(refreshCookie(res))
  })

  test('logout revokes refresh tokens', async () => {
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie)
    assert.equal(res.status, 204)
    assert.match(refreshCookie(res), /Expires=Thu, 01 Jan 1970/)
    const after = await request(app).post('/api/auth/refresh').set('Cookie', cookie)
    assert.equal(after.status, 401)
  })

  test('5 wrong passwords lock the account for 15 minutes', async () => {
    await request(app).post('/api/auth/register').send({ ...account, email: 'lock@example.com' })
    const attempt = (password) => request(app).post('/api/auth/login').send({ email: 'lock@example.com', password })
    for (let i = 1; i <= 4; i++) assert.equal((await attempt('wrong1234')).status, 401)
    const fifth = await attempt('wrong1234')
    assert.equal(fifth.status, 423)
    assert.match(fifth.body.error, /Try again in 15 minutes/)
    assert.equal(fifth.headers['retry-after'], '900')

    const correctWhileLocked = await attempt('secret123')
    assert.equal(correctWhileLocked.status, 423)

    await User.updateOne({ email: 'lock@example.com' }, { lockUntil: new Date(Date.now() - 1000) })
    assert.equal((await attempt('secret123')).status, 200)
  })
})

test('login is rate limited per IP', { skip: !hasDb }, async () => {
  const limited = createApp()
  let last
  for (let i = 0; i < 31; i++) {
    last = await request(limited).post('/api/auth/login').send({ email: 'x' })
  }
  assert.equal(last.status, 429)
})
