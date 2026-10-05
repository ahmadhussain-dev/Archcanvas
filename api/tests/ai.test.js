import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectTestDatabase, closeTestDatabase } from './helpers/db.js'
import { summarizePlan, toWorld, planFrame } from '../src/lib/planSummary.js'
import { checkOperations, parseReply, buildMessages, minSizeFor } from '../src/lib/aiPlan.js'
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
    assert.equal(lounge.kind, 'lounge')
    assert.deepEqual(lounge.openings, ['door bottom to outside'])
    assert.deepEqual(lounge.furniture, ['sofa'])
    assert.deepEqual(summary.stairs, [])
  })

  test('a door says which room it leads to', () => {
    const plan = building()
    // A 15 x 12 ft kitchen right below the lounge, sharing its bottom wall.
    plan.floorplan.floor.rooms.push({ id: 'room_2', name: 'Kitchen', x: r3(-12.5 * FT + 7.5 * FT), z: r3(22.5 * FT - 21 * FT), width: r3(15 * FT), depth: r3(12 * FT), shape: 'square', floorId: 'floor_1', wallIds: { north: 'w1' } })
    const [lounge, kitchen] = summarizePlan(plan).rooms
    assert.deepEqual(lounge.openings, ['door bottom to Kitchen'])
    assert.deepEqual(kitchen.openings, ['door top to Lounge'])
    assert.equal(kitchen.kind, 'kitchen')
  })

  test('a plot smaller than the house still frames the whole house', () => {
    const plan = building()
    const plot = plan.floorplan.floor.rooms[0]
    Object.assign(plot, { width: 3, depth: 3 })
    const summary = summarizePlan(plan)
    assert.ok(summary.plot.width >= 15 && summary.plot.depth >= 15)
    const { operations, skipped } = checkOperations(plan, [{ op: 'add_room', name: 'Bedroom 1', x: 0, y: 0, width: 11, depth: 12 }])
    assert.equal(operations.length, 0)
    assert.match(skipped[0].reason, /overlap Lounge/)
  })

  test('an upper floor sees the outline and stairs of the floor below', () => {
    const plan = building()
    plan.floorplan.floors.push({ id: 'floor_2', name: 'First', level: 1 })
    plan.floorplan.currentFloorId = 'floor_2'
    plan.floorplan.stairs = [{ id: 's1', x: r3(-12.5 * FT + 2 * FT), z: r3(22.5 * FT - 6 * FT), width: r3(3 * FT), depth: r3(10 * FT), rotation: 0, floorId: 'floor_1' }]
    const summary = summarizePlan(plan)
    assert.deepEqual(summary.rooms, [])
    assert.deepEqual(summary.plot, { width: 25, depth: 45 })
    assert.deepEqual(summary.floorBelow.outline, { x: 0, y: 0, width: 15, depth: 15 })
    assert.deepEqual(summary.floorBelow.stairs, [{ x: 0.5, y: 1, width: 3, depth: 10 }])
    assert.equal(summarizePlan(building()).floorBelow, undefined)
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

  test('furnishes rooms by their kind', () => {
    const { operations, skipped } = checkOperations(building(), [
      { op: 'add_room', name: 'Bedroom 1', x: 0, y: 15, width: 11, depth: 12 },
      { op: 'furnish_room', room: 'Bedroom 1' },
      { op: 'furnish_room', room: 'room_1' },
      { op: 'update_room', room: 'room_1', name: 'Hall' },
      { op: 'furnish_room', room: 'room_1' },
      { op: 'furnish_room', room: 'room_1', as: 'drawing room' },
      { op: 'furnish_room', room: 'room_1', as: 'spaceship' }
    ], { idPrefix: 'ai' })
    assert.deepEqual(operations.filter((o) => o.op === 'furnish_room').map((o) => [o.room, o.kind]), [['ai_1', 'bedroom'], ['room_1', 'lounge'], ['room_1', 'drawing room']])
    assert.equal(skipped.length, 2)
    assert.match(skipped[0].reason, /what kind of room "Hall" is/)
  })

  test('layout_floor replaces the floor with a computed layout, doors, windows and furniture', () => {
    const { operations, skipped } = checkOperations(building(), [
      { op: 'layout_floor', rooms: [
        { name: 'Master Bedroom', zone: 'back' }, { name: 'Master Bath', attached_to: 'Master Bedroom' },
        { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase' }, { name: 'Kitchen' },
        { name: 'Car Porch' }, { name: 'Drawing Room' }
      ] },
      { op: 'set_floor', room: 'Kitchen', material: 'brick-square' }
    ], { idPrefix: 'ai' })
    assert.deepEqual(skipped, [])
    assert.deepEqual(operations[0], { op: 'delete_room', room: 'room_1', label: 'Remove Lounge' })
    const added = operations.filter((o) => o.op === 'add_room')
    assert.equal(added.length, 7)
    const area = added.reduce((sum, room) => sum + room.width * room.depth, 0)
    assert.ok(Math.abs(area - 25 * 45 * FT * FT) < 0.05, 'the rooms fill the plot')
    const gate = operations.find((o) => o.op === 'add_opening' && o.room === added.find((r) => r.name === 'Car Porch').id && o.side === 'bottom')
    assert.ok(gate && Number.isFinite(gate.at), 'the car porch has a gate at a set spot')
    assert.ok(operations.some((o) => o.op === 'add_opening' && o.kind === 'window'))
    assert.deepEqual(operations.filter((o) => o.op === 'furnish_room').map((o) => o.kind).sort(),
      ['bathroom', 'bedroom', 'car porch', 'drawing room', 'kitchen', 'lounge', 'staircase'])
    assert.equal(operations.at(-1).op, 'set_floor')
  })

  test('layout_floor upstairs builds over the floor below; an attached bath is a bathroom', () => {
    const plan = building()
    plan.floorplan.floors.push({ id: 'floor_2', name: 'First', level: 1 })
    plan.floorplan.currentFloorId = 'floor_2'
    const { operations, skipped } = checkOperations(plan, [{ op: 'layout_floor', rooms: [{ name: 'Bedroom', zone: 'back' }, { name: 'Master Bath', attached_to: 'Bedroom' }] }], { idPrefix: 'ai' })
    const added = operations.filter((o) => o.op === 'add_room')
    const minX = Math.min(...added.map((r) => r.x - r.width / 2))
    const maxX = Math.max(...added.map((r) => r.x + r.width / 2))
    assert.ok(Math.abs(maxX - minX - 15 * FT) < 0.01, 'as wide as the lounge below')
    // 15 ft is too narrow for a 10 ft bedroom and a 5 ft bath side by side.
    assert.deepEqual(skipped.map((s) => s.label), ['Add Master Bath'])
    assert.equal(minSizeFor('Master Bath').kind, 'bathroom')
  })

  test('an upstairs terrace may stick out up to 5 ft past the front of the plot', () => {
    const plan = building()
    plan.floorplan.floors.push({ id: 'floor_2', name: 'First', level: 1 })
    plan.floorplan.currentFloorId = 'floor_2'
    const { operations, skipped } = checkOperations(plan, [
      { op: 'add_room', name: 'Front Terrace', x: 0, y: 45, width: 25, depth: 5 },
      { op: 'add_room', name: 'Balcony', x: 0, y: 45, width: 10, depth: 7 },
      { op: 'add_room', name: 'Bedroom 2', x: 10, y: 45, width: 12, depth: 5 }
    ])
    assert.deepEqual(operations.map((o) => o.name), ['Front Terrace'])
    assert.match(skipped[0].reason, /more than 5 ft past the front/)
    assert.match(skipped[1].reason, /outside the 25 x 45 ft plot/)
    // Not on the ground floor.
    const ground = checkOperations(building(), [{ op: 'add_room', name: 'Terrace', x: 0, y: 45, width: 25, depth: 5 }])
    assert.equal(ground.operations.length, 0)
  })

  test('a door can be put at a set spot', () => {
    const { operations } = checkOperations(building(), [{ op: 'add_door', room: 'room_1', side: 'bottom', at: 4 }])
    assert.equal(operations[0].at, r3(-12.5 * FT + 4 * FT))
  })

  test('the prompt explains furnishing and doors', () => {
    const [system] = buildMessages({
      summary: summarizePlan(building()),
      prompt: 'furnish the house',
      project: { name: 'Ghar', city: 'Faisalabad', plot: { widthFt: 25, depthFt: 45 }, floors: 1 }
    })
    assert.match(system.content, /"op":"furnish_room"/)
    assert.match(system.content, /kitchen: counter with sink/)
    assert.match(system.content, /Every room needs a door/)
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

  test('the demo AI adds a bedroom in free space and furnishes rooms', async () => {
    const demo = createApp({ rateLimited: false, aiProvider: mockProvider() })
    const res = await request(demo).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'add a bedroom', floorplan: building() })
    assert.equal(res.status, 200)
    assert.deepEqual(res.body.skipped, [])
    assert.deepEqual(res.body.operations.map((o) => o.op), ['add_room', 'add_opening', 'add_opening', 'furnish_room'])
    const styled = await request(demo).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'furnish every room', floorplan: building() })
    assert.deepEqual(styled.body.operations.map((o) => [o.op, o.kind]), [['furnish_room', 'lounge']])
    const floor = await request(demo).post(`/api/projects/${projectId}/ai`).set(me).send({ prompt: 'design the ground floor', floorplan: building() })
    assert.deepEqual(floor.body.skipped, [])
    assert.equal(floor.body.operations.filter((o) => o.op === 'add_room').length, 7)
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
    assert.match(aiError(429, '', 'x').message, /per-minute.*a minute/)
    const perMinute = 'Quota exceeded for metric: generate_content_free_tier_requests, limit: 10\nPlease retry in 38.2s.'
    assert.match(aiError(429, perMinute, 'gemini-3.8-flash').message, /Wait 39 seconds/)
    const perDay = JSON.stringify([{ error: { code: 429, message: 'You exceeded your current quota.', details: [{ violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }] } }])
    const daily = aiError(429, 'You exceeded your current quota.', 'gemini-3.8-flash', perDay)
    assert.match(daily.message, /daily AI limit for gemini-3\.8-flash.*AI_FALLBACK_MODELS/)
    assert.match(aiError(503, 'high demand', 'x').message, /busy/)
    // Gemini's busy message mentions "model"; it must not read as a missing model.
    const busy = aiError(503, 'This model is currently experiencing high demand. Please try again later.', 'gemini-3.8-flash')
    assert.equal(busy.status, 503)
    assert.match(busy.message, /busy/)
    // Never tell people to set the model they already have.
    assert.match(aiError(404, 'models/gemini-3.8-flash is not found', 'gemini-3.8-flash').message, /a model listed in Google AI Studio/)
    assert.match(aiError(400, 'Bad request field', 'x').message, /\(Bad request field\)/)
  })
})

describe('AI provider retries', () => {
  test('retries a busy model, then tries the fallback', async () => {
    const { openAiCompatibleProvider } = await import('../src/services/ai.js')
    const realFetch = globalThis.fetch
    const calls = []
    const busy = () => new Response(JSON.stringify([{ error: { code: 503, message: 'high demand' } }]), { status: 503 })
    globalThis.fetch = async (url, init) => {
      const { model } = JSON.parse(init.body)
      calls.push(model)
      if (model === 'main') return busy()
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"message":"ok"}' } }] }), { status: 200 })
    }
    try {
      const ask = openAiCompatibleProvider({ apiKey: 'k', model: 'main', fallbackModels: ['spare'], retryDelaysMs: [0, 0] })
      assert.equal(await ask([]), '{"message":"ok"}')
      assert.deepEqual(calls, ['main', 'main', 'main', 'spare'])

      calls.length = 0
      const alone = openAiCompatibleProvider({ apiKey: 'k', model: 'main', retryDelaysMs: [0] })
      await assert.rejects(alone([]), (err) => err.status === 503 && /busy/.test(err.message))
      assert.deepEqual(calls, ['main', 'main'])
    } finally {
      globalThis.fetch = realFetch
    }
  })

  test('moves to the next model when a limit is used up', async () => {
    const { openAiCompatibleProvider } = await import('../src/services/ai.js')
    const realFetch = globalThis.fetch
    const calls = []
    const limited = () => new Response(JSON.stringify([{ error: { code: 429, message: 'Quota exceeded. Please retry in 20s.' } }]), { status: 429 })
    globalThis.fetch = async (url, init) => {
      const { model } = JSON.parse(init.body)
      calls.push(model)
      if (model === 'spare') return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 })
      return limited()
    }
    try {
      const ask = openAiCompatibleProvider({ apiKey: 'k', model: 'main', fallbackModels: ['spare'], retryDelaysMs: [0] })
      assert.equal(await ask([]), 'ok')
      assert.deepEqual(calls, ['main', 'spare'])

      // When every model fails, the main model's error is the one shown.
      calls.length = 0
      const both = openAiCompatibleProvider({ apiKey: 'k', model: 'main', fallbackModels: ['other'], retryDelaysMs: [0] })
      await assert.rejects(both([]), (err) => err.status === 429 && /Wait 20 seconds/.test(err.message))
      assert.deepEqual(calls, ['main', 'other'])
    } finally {
      globalThis.fetch = realFetch
    }
  })

  test('does not retry a bad key', async () => {
    const { openAiCompatibleProvider } = await import('../src/services/ai.js')
    const realFetch = globalThis.fetch
    let count = 0
    globalThis.fetch = async () => {
      count += 1
      return new Response(JSON.stringify([{ error: { message: 'Please pass a valid API key' } }]), { status: 400 })
    }
    try {
      await assert.rejects(openAiCompatibleProvider({ apiKey: 'k', retryDelaysMs: [0, 0] })([]), /AI_API_KEY/)
      assert.equal(count, 1)
    } finally {
      globalThis.fetch = realFetch
    }
  })
})
