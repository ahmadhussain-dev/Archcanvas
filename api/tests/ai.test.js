import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'
import { summarizePlan, toWorld, planFrame } from '../src/lib/planSummary.js'
import { checkOperations, parseReply, buildMessages } from '../src/lib/aiPlan.js'
import { mockProvider } from '../src/services/ai.js'

const FT = 0.3048
const r3 = (v) => Math.round(v * 1000) / 1000

// A 25 x 45 ft plot centred on the origin with a 15 x 15 ft lounge in its top-left corner.
function building() {
  return {
    format: 'blueprint3d-babylon.building.v1',
    floorplan: {
      unit: 'm',
      wallThickness: 0.23,
      currentFloorId: 'floor_1',
      floors: [{ id: 'floor_1', name: 'Ground', level: 0 }],
      floor: {
        rooms: [
          { id: 'plot', name: 'Plot', x: 0, z: 0, width: r3(25 * FT), depth: r3(45 * FT), shape: 'square', floorId: 'floor_1' },
          { id: 'room_1', name: 'Lounge', x: r3(-12.5 * FT + 7.5 * FT), z: r3(22.5 * FT - 7.5 * FT), width: r3(15 * FT), depth: r3(15 * FT), shape: 'square', floorId: 'floor_1', wallIds: { south: 'w1' } }
        ]
      },
      walls: [{ id: 'w1', from: [r3(-12.5 * FT), r3(7.5 * FT)], to: [r3(2.5 * FT), r3(7.5 * FT)], floorId: 'floor_1' }],
      openings: [{ id: 'd1', type: 'door', wallId: 'w1', t: 0.5, floorId: 'floor_1' }],
      items: [{ id: 'i1', type: 'sofa', x: -2, z: 5, floorId: 'floor_1', roomId: 'room_1' }]
    }
  }
}

describe('plan summary', () => {
  test('rooms in feet from the plot top-left', () => {
    const summary = summarizePlan(building())
    assert.deepEqual(summary.plot, { width: 25, depth: 45 })
    assert.equal(summary.rooms.length, 1)
    const [lounge] = summary.rooms
    assert.deepEqual({ x: lounge.x, y: lounge.y, width: lounge.width, depth: lounge.depth }, { x: 0, y: 0, width: 15, depth: 15 })
    assert.deepEqual(lounge.openings, ['door bottom'])
    assert.deepEqual(lounge.furniture, ['sofa'])
  })

  test('feet to metres puts the room centre in the right place', () => {
    const frame = planFrame(building().floorplan)
    const world = toWorld(frame, { x: 15, y: 0, width: 10, depth: 12 })
    assert.equal(world.x, r3(-12.5 * FT + 20 * FT))
    assert.equal(world.z, r3(22.5 * FT - 6 * FT))
    assert.equal(world.width, r3(10 * FT))
  })

  test('the prompt carries the plan, the rules and the request', () => {
    const [system, user] = buildMessages({
      summary: summarizePlan(building()),
      prompt: 'add a bedroom',
      project: { name: 'Ghar', city: 'Faisalabad', plot: { widthFt: 25, depthFt: 45 }, floors: 1 }
    })
    assert.match(system.content, /bedroom 10x10/)
    assert.match(system.content, /wood-plank-oak-light/)
    assert.match(user.content, /"Lounge"/)
    assert.match(user.content, /Request: add a bedroom$/)
  })
})

describe('checking AI changes', () => {
  test('keeps good changes and converts them for the editor', () => {
    const { operations, skipped } = checkOperations(building(), [
      { op: 'add_room', name: 'Bedroom 1', x: 0, y: 15, width: 11, depth: 12 },
      { op: 'add_furniture', room: 'Bedroom 1', type: 'bed_double' },
      { op: 'paint_walls', room: 'room_1', color: '#AABBCC' },
      { op: 'set_floor', room: 'lounge', material: 'brick-marble-warm' },
      { op: 'add_door', room: 'Bedroom 1', side: 'left' }
    ], { idPrefix: 'ai' })
    assert.deepEqual(skipped, [])
    assert.equal(operations.length, 5)
    assert.deepEqual(operations[0], { op: 'add_room', id: 'ai_1', name: 'Bedroom 1', x: r3(-12.5 * FT + 5.5 * FT), z: r3(22.5 * FT - 21 * FT), width: r3(11 * FT), depth: r3(12 * FT), label: 'Add Bedroom 1 (10.2 x 11.2 ft inside)' })
    assert.equal(operations[1].room, 'ai_1')
    assert.equal(operations[2].color, '#aabbcc')
    assert.equal(operations[3].room, 'room_1')
    assert.deepEqual(operations[4], { op: 'add_opening', room: 'ai_1', kind: 'door', side: 'left', label: 'Add a door on the left wall of Bedroom 1' })
  })

  test('refuses rooms that are too small, outside the plot or overlapping', () => {
    const { operations, skipped } = checkOperations(building(), [
      { op: 'add_room', name: 'Bedroom 2', x: 15, y: 15, width: 9, depth: 12 },
      { op: 'add_room', name: 'Kitchen', x: 18, y: 20, width: 9, depth: 10 },
      { op: 'add_room', name: 'Store', x: 10, y: 10, width: 6, depth: 6 },
      { op: 'add_furniture', room: 'Bedroom 2', type: 'bed_double' }
    ])
    assert.equal(operations.length, 0)
    assert.match(skipped[0].reason, /a bedroom needs at least 10 x 10 ft/)
    assert.match(skipped[1].reason, /outside the 25 x 45 ft plot/)
    assert.match(skipped[2].reason, /overlap Lounge/)
    assert.match(skipped[3].reason, /not on this floor/)
  })

  test('a deleted room frees its space; the plot and unknown changes are refused', () => {
    const { operations, skipped } = checkOperations(building(), [
      { op: 'delete_room', room: 'room_1' },
      { op: 'add_room', name: 'Drawing Room', x: 0, y: 0, width: 14, depth: 14 },
      { op: 'delete_room', room: 'plot' },
      { op: 'fly', room: 'room_1' },
      { op: 'add_furniture', room: 'Drawing Room', type: 'spaceship' }
    ])
    assert.deepEqual(operations.map((o) => o.op), ['delete_room', 'add_room'])
    assert.equal(skipped.length, 3)
  })

  test('reads JSON wrapped in a code fence', () => {
    const reply = parseReply('```json\n{"message":"Done","operations":[{"op":"delete_room","room":"x"}]}\n```')
    assert.equal(reply.message, 'Done')
    assert.equal(reply.refused, false)
    assert.equal(reply.operations.length, 1)
    assert.throws(() => parseReply('sorry'))
  })
})

const hasDb = await connectTestDatabase('ai')

describe('POST /projects/:id/ai', { skip: !hasDb }, () => {
  let me
  let projectId
  let lastMessages
  const answers = []
  const app = createApp({
    rateLimited: false,
    aiProvider: async (messages) => {
      lastMessages = messages
      return answers.shift()
    }
  })

  before(async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email: 'ai@example.com', password: 'secret123' })
    me = { Authorization: `Bearer ${res.body.accessToken}` }
    const created = await request(app).post('/api/projects').set(me).send({ name: 'Ghar', plot: { widthFt: 25, depthFt: 45 } })
    projectId = created.body.project.id
  })
  after(closeTestDatabase)

  test('needs login and a prompt', async () => {
    assert.equal((await request(app).post(`/api/projects/${projectId}/ai`).send({})).status, 401)
    const res = await request(app).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: '', floorplan: building() })
    assert.equal(res.status, 400)
  })

  test('returns checked changes from the AI', async () => {
    answers.push(JSON.stringify({
      message: 'Added a bedroom.',
      operations: [
        { op: 'add_room', name: 'Bedroom', x: 0, y: 15, width: 11, depth: 12 },
        { op: 'add_room', name: 'Bedroom 2', x: 0, y: 30, width: 8, depth: 8 }
      ]
    }))
    const res = await request(app).post(`/api/projects/${projectId}/ai`).set(me)
      .send({ prompt: 'add two bedrooms', floorplan: JSON.stringify(building()) })
    assert.equal(res.status, 200)
    assert.equal(res.body.message, 'Added a bedroom.')
    assert.equal(res.body.refused, false)
    assert.equal(res.body.operations.length, 1)
    assert.equal(res.body.skipped.length, 1)
    assert.match(lastMessages[1].content, /Project: Ghar, Faisalabad/)
  })

  test('passes a refusal through', async () => {
    answers.push(JSON.stringify({ refused: true, message: 'Five bedrooms do not fit on 2 Marla.', operations: [] }))
    const res = await request(app).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'five bedrooms', floorplan: building() })
    assert.equal(res.status, 200)
    assert.equal(res.body.refused, true)
    assert.deepEqual(res.body.operations, [])
  })

  test('an unreadable answer is a clear error', async () => {
    answers.push('I think you should add a bedroom.')
    const res = await request(app).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'add a bedroom', floorplan: building() })
    assert.equal(res.status, 502)
    assert.match(res.body.error, /could not be understood/)
  })

  test('the demo AI adds a bedroom in free space', async () => {
    const demo = createApp({ rateLimited: false, aiProvider: mockProvider() })
    const res = await request(demo).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'add a bedroom', floorplan: building() })
    assert.equal(res.status, 200)
    assert.deepEqual(res.body.skipped, [])
    assert.deepEqual(res.body.operations.map((o) => o.op), ['add_room', 'add_opening', 'add_opening', 'add_furniture', 'add_furniture'])
  })

  test('without a key the API says how to set it up', async () => {
    const plain = createApp({ rateLimited: false })
    const saved = { key: process.env.AI_API_KEY, provider: process.env.AI_PROVIDER }
    delete process.env.AI_API_KEY
    delete process.env.AI_PROVIDER
    const res = await request(plain).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'add a bedroom', floorplan: building() })
    if (saved.key) process.env.AI_API_KEY = saved.key
    if (saved.provider) process.env.AI_PROVIDER = saved.provider
    assert.equal(res.status, 503)
    assert.match(res.body.error, /AI_API_KEY/)
  })
})

describe('AI service errors', () => {
  test('say what to fix', async () => {
    const { aiError } = await import('../src/services/ai.js')
    assert.match(aiError(400, 'Please pass a valid API key', 'gemini-3.8-flash').message, /AI_API_KEY/)
    assert.match(aiError(404, 'models/DefaultTextModel is not found', 'DefaultTextModel').message, /"DefaultTextModel" is not available.*AI_MODEL=gemini-3.8-flash/)
    const retired = 'This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash for the latest features.'
    assert.match(aiError(404, retired, 'gemini-2.5-flash').message, /AI_MODEL=gemini-3\.8-flash in api/)
    assert.equal(aiError(429, '', 'x').status, 429)
    assert.match(aiError(500, 'Internal error', 'x').message, /\(Internal error\)/)
  })
})
