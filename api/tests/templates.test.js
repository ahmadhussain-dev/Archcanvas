import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { TEMPLATE_DESIGNS, buildTemplate, listTemplates } from '../src/lib/templates.js'
import { PLOT_PRESETS } from '../src/lib/units.js'
import { roomKind, summarizePlan } from '../src/lib/planSummary.js'
import { planPreview } from '../src/lib/planPreview.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'

const app = createApp({ rateLimited: false })
const OUTDOOR = new Set(['terrace', 'car porch'])
const overlaps = (a, b) => a.x < b.x + b.width - 0.01 && b.x < a.x + a.width - 0.01 && a.y < b.y + b.depth - 0.01 && b.y < a.y + a.depth - 0.01

describe('house templates', () => {
  test('one template for each plot size from 2 Marla to 2 Kanal', () => {
    const sizes = PLOT_PRESETS.filter((p) => p.marla >= 2).map((p) => p.key)
    assert.deepEqual(TEMPLATE_DESIGNS.map((d) => d.plot), sizes)
  })

  for (const design of TEMPLATE_DESIGNS) {
    describe(design.name, () => {
      const preset = PLOT_PRESETS.find((p) => p.key === design.plot)
      const { building, skipped } = buildTemplate(design)

      test('every door, window and stair is placed (only spare furniture may not fit)', () => {
        const bad = skipped.filter((s) => !/free space|Only \d+ of/.test(s.reason))
        assert.deepEqual(bad, [])
      })

      for (const [i, floor] of design.floors.entries()) {
        test(`floor ${i + 1}: rooms stay inside the plot and never overlap`, () => {
          for (const r of floor.rooms) {
            assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= preset.widthFt && r.y + r.depth <= preset.depthFt, `${r.name} is outside the plot`)
          }
          for (const [a, ra] of floor.rooms.entries()) {
            for (const rb of floor.rooms.slice(a + 1)) assert.ok(!overlaps(ra, rb), `${ra.name} overlaps ${rb.name}`)
          }
        })

        test(`floor ${i + 1}: every indoor room has a way in`, () => {
          const { openings } = planPreview(building).floors[i]
          const onEdge = (r, o) => {
            const near = (a, b) => Math.abs(a - b) < 0.6
            const inX = o.x > r.x - 0.6 && o.x < r.x + r.width + 0.6
            const inY = o.y > r.y - 0.6 && o.y < r.y + r.depth + 0.6
            return inX && inY && (near(o.x, r.x) || near(o.x, r.x + r.width) || near(o.y, r.y) || near(o.y, r.y + r.depth))
          }
          for (const r of floor.rooms) {
            if (OUTDOOR.has(roomKind(r.name))) continue
            assert.ok(openings.some((o) => o.type !== 'window' && onEdge(r, o)), `${r.name} has no door or archway`)
          }
        })
      }

      test('the stairs go over the stairs below, and furniture is in every lived-in room', () => {
        const fp = building.floorplan
        const stairs = fp.stairs ?? []
        assert.ok(stairs.some((s) => s.floorId === 'floor_1'), 'stairs on the ground floor')
        const rooms = design.floors.map((f) => f.rooms.find((r) => /stair/i.test(r.name)))
        assert.deepEqual(rooms[0], rooms[1], 'the stair hall is in the same place on both floors')
        const plan = summarizePlan(building)
        for (const r of plan.rooms) {
          if (['bedroom', 'kitchen', 'lounge', 'bathroom'].includes(roomKind(r.name))) assert.ok(r.furniture.length > 0, `${r.name} is empty`)
        }
      })
    })
  }

  test('GET /api/templates lists cards with a plan preview and no building file', async () => {
    const res = await request(app).get('/api/templates')
    assert.equal(res.status, 200)
    assert.equal(res.body.templates.length, TEMPLATE_DESIGNS.length)
    const card = res.body.templates.find((t) => t.key === '5-marla')
    assert.equal(card.plot.label, '5 Marla')
    assert.equal(card.floors, 2)
    assert.ok(card.bedrooms >= 3)
    assert.equal(card.preview.floors.length, 2)
    assert.ok(card.preview.floors[0].walls.length > 10)
    assert.equal(card.building, undefined)
  })

  test('GET /api/templates/:key gives one card, or a 404', async () => {
    const res = await request(app).get('/api/templates/1-kanal')
    assert.equal(res.status, 200)
    assert.equal(res.body.template.name, '1 Kanal family house')
    assert.equal((await request(app).get('/api/templates/9-marla')).status, 404)
  })
})

const hasDb = await connectTestDatabase('templates')

describe('new project from a template', { skip: !hasDb }, () => {
  let auth
  before(async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email: 'tpl@example.com', password: 'secret123' })
    auth = { Authorization: `Bearer ${res.body.accessToken}` }
  })
  after(closeTestDatabase)

  test('needs login', async () => {
    assert.equal((await request(app).post('/api/projects/from-template').send({ template: '5-marla' })).status, 401)
  })

  test('creates a two-floor project with the furnished house as its first version', async () => {
    const res = await request(app).post('/api/projects/from-template').set(auth).send({ template: '5-marla', city: 'Lahore' })
    assert.equal(res.status, 201)
    const { project } = res.body
    assert.equal(project.name, '5 Marla family house')
    assert.equal(project.city, 'Lahore')
    assert.equal(project.floors, 2)
    assert.equal(project.plot.areaMarla, 5)
    assert.equal(project.versionCount, 1)
    const opened = await request(app).get(`/api/projects/${project.id}`).set(auth)
    assert.ok(opened.body.floorplan.floorplan.floor.rooms.length > 15)
    const versions = await request(app).get(`/api/projects/${project.id}/versions`).set(auth)
    assert.equal(versions.body.versions[0].source, 'template')
  })

  test('an unknown template is a 404', async () => {
    assert.equal((await request(app).post('/api/projects/from-template').set(auth).send({ template: 'nope' })).status, 404)
  })
})
