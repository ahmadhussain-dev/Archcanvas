import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'

const app = createApp()

test('GET /api/health reports the API and database state', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'ok')
  assert.equal(res.body.database, 'disconnected')
})

test('unknown routes return a JSON 404', async () => {
  const res = await request(app).get('/api/nope')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { error: 'Not found' })
})

test('security headers are set', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.headers['x-powered-by'], undefined)
  assert.ok(res.headers['x-content-type-options'])
})
