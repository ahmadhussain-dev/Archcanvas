import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'

const hasDb = await connectTestDatabase('projects')
const app = createApp({ rateLimited: false })

async function signUp(email) {
  const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email, password: 'secret123' })
  return { Authorization: `Bearer ${res.body.accessToken}` }
}

const plan = (label) => ({ version: 1, floors: [{ name: label, walls: [] }] })

describe('projects', { skip: !hasDb }, () => {
  let me
  let other
  let projectId

  before(async () => {
    me = await signUp('owner@example.com')
    other = await signUp('other@example.com')
  })
  after(closeTestDatabase)

  test('needs login', async () => {
    assert.equal((await request(app).get('/api/projects')).status, 401)
  })

  test('create a project with plot size and requirements', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(me)
      .send({
        name: 'Ghar 5 Marla',
        plot: { preset: '5-marla', widthFt: 25, depthFt: 45 },
        floors: 2,
        requirements: { bedrooms: 3, bathrooms: 3, carPorch: true }
      })
    assert.equal(res.status, 201)
    const { project } = res.body
    projectId = project.id
    assert.equal(project.city, 'Faisalabad')
    assert.equal(project.roofHeightFt, 10.5)
    assert.equal(project.plot.areaSqft, 1125)
    assert.equal(project.plot.areaMarla, 5)
    assert.equal(project.versionCount, 0)
  })

  test('rejects bad input', async () => {
    const res = await request(app).post('/api/projects').set(me).send({ name: 'x', plot: { widthFt: 2, depthFt: 45 } })
    assert.equal(res.status, 400)
    assert.equal(res.body.details[0].field, 'plot.widthFt')
  })

  test('lists only my projects, newest first', async () => {
    await request(app).post('/api/projects').set(other).send({ name: 'Not mine', plot: { widthFt: 30, depthFt: 60 } })
    const res = await request(app).get('/api/projects').set(me)
    assert.equal(res.status, 200)
    assert.equal(res.body.total, 1)
    assert.equal(res.body.projects[0].name, 'Ghar 5 Marla')
  })

  test("someone else's project is a 404", async () => {
    assert.equal((await request(app).get(`/api/projects/${projectId}`).set(other)).status, 404)
    assert.equal((await request(app).patch(`/api/projects/${projectId}`).set(other).send({ name: 'Mine now' })).status, 404)
    assert.equal((await request(app).get('/api/projects/not-an-id').set(me)).status, 404)
  })

  test('update fields', async () => {
    const res = await request(app).patch(`/api/projects/${projectId}`).set(me).send({ name: 'Ghar', roofHeightFt: 12 })
    assert.equal(res.status, 200)
    assert.equal(res.body.project.name, 'Ghar')
    assert.equal(res.body.project.roofHeightFt, 12)
    assert.equal((await request(app).patch(`/api/projects/${projectId}`).set(me).send({})).status, 400)
  })

  test('save versions, list them, open one and restore it', async () => {
    const v1 = await request(app).post(`/api/projects/${projectId}/versions`).set(me).send({ floorplan: plan('first') })
    assert.equal(v1.status, 201)
    assert.equal(v1.body.version.number, 1)
    assert.equal(v1.body.version.floorplan, undefined)

    const saves = await Promise.all(
      ['a', 'b'].map((n) =>
        request(app).post(`/api/projects/${projectId}/versions`).set(me).send({ floorplan: plan(n), source: 'manual' })
      )
    )
    assert.deepEqual(saves.map((r) => r.body.version.number).sort(), [2, 3])

    // Autosaves after a Save share one draft version, the newest replacing it.
    for (const n of ['draft1', 'draft2', 'c']) {
      const auto = await request(app).post(`/api/projects/${projectId}/versions`).set(me).send({ floorplan: plan(n), source: 'autosave' })
      assert.equal(auto.status, 201)
      assert.equal(auto.body.version.number, 4)
    }

    const list = await request(app).get(`/api/projects/${projectId}/versions`).set(me)
    assert.deepEqual(list.body.versions.map((v) => v.number), [4, 3, 2, 1])
    assert.equal(list.body.versions[0].floorplan, undefined)
    assert.equal(list.body.versions[0].source, 'autosave')
    const draft = await request(app).get(`/api/projects/${projectId}/versions/4`).set(me)
    assert.equal(draft.body.version.floorplan.floors[0].name, 'c')

    const one = await request(app).get(`/api/projects/${projectId}/versions/1`).set(me)
    assert.equal(one.body.version.floorplan.floors[0].name, 'first')

    const restored = await request(app).post(`/api/projects/${projectId}/versions/1/restore`).set(me)
    assert.equal(restored.status, 201)
    assert.equal(restored.body.version.number, 5)
    assert.equal(restored.body.version.source, 'restore')

    const open = await request(app).get(`/api/projects/${projectId}`).set(me)
    assert.equal(open.body.version, 5)
    assert.equal(open.body.floorplan.floors[0].name, 'first')
    assert.equal(open.body.project.versionCount, 5)

    // After the restore, the next autosave starts a new draft.
    const after = await request(app).post(`/api/projects/${projectId}/versions`).set(me).send({ floorplan: plan('d'), source: 'autosave' })
    assert.equal(after.body.version.number, 6)

    assert.equal((await request(app).get(`/api/projects/${projectId}/versions/99`).set(me)).status, 404)
    const restoreSource = await request(app)
      .post(`/api/projects/${projectId}/versions`)
      .set(me)
      .send({ floorplan: plan('x'), source: 'restore' })
    assert.equal(restoreSource.status, 400)
  })

  test('estimate for a project', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/estimate`).set(me)
    assert.equal(res.status, 200)
    const { estimate } = res.body
    assert.equal(estimate.coveredAreaSqft, 2250)
    assert.equal(estimate.lines.length, 7)
    assert.ok(estimate.totalPkr > 0)
    assert.equal(estimate.hasUnverifiedRates, true)
  })

  test('delete removes the project and its versions', async () => {
    assert.equal((await request(app).delete(`/api/projects/${projectId}`).set(other)).status, 404)
    assert.equal((await request(app).delete(`/api/projects/${projectId}`).set(me)).status, 204)
    assert.equal((await request(app).get(`/api/projects/${projectId}`).set(me)).status, 404)
  })
})
