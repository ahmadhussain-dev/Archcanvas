import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutFloor } from '../src/lib/layoutFloor.js'
import { minSizeFor } from '../src/lib/aiPlan.js'

const wallFt = 0.75
const GROUND = [
  { name: 'Master Bedroom', zone: 'back' }, { name: 'Master Bath', attached_to: 'Master Bedroom' },
  { name: 'Bedroom 2', zone: 'back' }, { name: 'Bath 2', attached_to: 'Bedroom 2' },
  { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: 'middle' },
  { name: 'Car Porch', zone: 'front' }, { name: 'Drawing Room', zone: 'front' }
]
const FIRST = [
  { name: 'Back Bedroom', zone: 'back' }, { name: 'Back Bath', attached_to: 'Back Bedroom' },
  { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Open Kitchen', zone: 'middle' },
  { name: 'Front Bedroom', zone: 'front' }, { name: 'Front Bath', attached_to: 'Front Bedroom' }, { name: 'Terrace', zone: 'front' }
]
const overlap = (a, b) => a.x < b.x + b.width - 0.01 && b.x < a.x + a.width - 0.01 && a.y < b.y + b.depth - 0.01 && b.y < a.y + a.depth - 0.01
const named = (result, name) => result.rooms.find((room) => room.name === name)

// Fills the area exactly, nothing overlaps, every room meets its minimum.
function assertSound(result, area) {
  const total = result.rooms.reduce((sum, room) => sum + room.width * room.depth, 0)
  assert.ok(Math.abs(total - area.width * area.depth) < 0.01, 'no gaps')
  for (const [i, a] of result.rooms.entries()) {
    assert.ok(a.x >= area.x - 0.01 && a.y >= area.y - 0.01 && a.x + a.width <= area.x + area.width + 0.01 && a.y + a.depth <= area.y + area.depth + 0.01, `${a.name} is inside`)
    const rule = a.kind === 'staircase' ? { min: [3.5, 9] } : minSizeFor(a.name)
    if (rule) {
      const clear = [a.width - wallFt, a.depth - wallFt].sort((p, q) => p - q)
      assert.ok(clear[0] >= rule.min[0] - 0.01 && clear[1] >= rule.min[1] - 0.01, `${a.name} is big enough`)
    }
    for (const b of result.rooms.slice(i + 1)) assert.ok(!overlap(a, b), `${a.name} and ${b.name} do not overlap`)
  }
}

describe('laying out a whole floor', () => {
  for (const [width, depth] of [[25, 45], [30, 50], [35, 70], [50, 90]]) {
    test(`a ${width} x ${depth} ft ground floor has no gaps and no undersized rooms`, () => {
      const area = { x: 0, y: 0, width, depth }
      const result = layoutFloor({ area, wallFt, rooms: GROUND, minSizeFor })
      assertSound(result, area)
      assert.ok(named(result, 'TV Lounge') && named(result, 'Kitchen') && named(result, 'Car Porch'))
      // The car porch is at the front with the gate on the street side.
      const porch = named(result, 'Car Porch')
      assert.equal(porch.y + porch.depth, depth)
      assert.ok(result.openings.some((o) => o.room === 'Car Porch' && o.kind === 'door' && o.side === 'bottom'))
      // Every room has a door (the lounge through its neighbours' doors); an attached bath opens into its bedroom.
      for (const room of result.rooms.filter((r) => r.kind !== 'lounge')) assert.ok(result.openings.some((o) => o.room === room.name && o.kind === 'door'), `${room.name} has a door`)
      const bath = named(result, 'Master Bath')
      const door = result.openings.find((o) => o.room === 'Master Bath' && o.kind === 'door')
      assert.equal(door.side, bath.x > named(result, 'Master Bedroom').x ? 'left' : 'right')
    })
  }

  test('a big plot fits everything; a small one says what was left out', () => {
    assert.deepEqual(layoutFloor({ area: { x: 0, y: 0, width: 35, depth: 70 }, wallFt, rooms: GROUND, minSizeFor }).skipped, [])
    const small = layoutFloor({ area: { x: 0, y: 0, width: 25, depth: 45 }, wallFt, rooms: GROUND, minSizeFor })
    assert.deepEqual(small.skipped.map((s) => s.label).sort(), ['Add Bath 2', 'Add Bedroom 2'])
  })

  test('the first floor puts its staircase over the stairs below', () => {
    const area = { x: 0, y: 0, width: 25, depth: 45 }
    const ground = layoutFloor({ area, wallFt, rooms: GROUND, minSizeFor })
    const below = named(ground, 'Staircase')
    const first = layoutFloor({ area, wallFt, rooms: FIRST, minSizeFor, ground: false, stairsBelow: below })
    assertSound(first, area)
    assert.deepEqual(first.skipped, [])
    const stairs = named(first, 'Staircase')
    assert.ok(stairs.x <= below.x + 0.01 && stairs.x + stairs.width >= below.x + below.width - 0.01, 'covers the stairs across')
    assert.ok(stairs.y <= below.y + 0.5 && stairs.y + stairs.depth >= below.y + below.depth - 0.5, 'covers the stairs front to back')
    // No street door upstairs; the terrace opens from inside.
    assert.ok(!first.openings.some((o) => o.kind === 'door' && o.side === 'bottom' && named(first, o.room).y + named(first, o.room).depth === 45))
    assert.ok(first.openings.some((o) => o.room === 'Terrace' && o.kind === 'door'))
  })

  test('a drawing room gets its own guest door and never opens into the kitchen', () => {
    const result = layoutFloor({ area: { x: 0, y: 0, width: 25, depth: 45 }, wallFt, rooms: GROUND, minSizeFor })
    const drawing = named(result, 'Drawing Room')
    const kitchen = named(result, 'Kitchen')
    for (const door of result.openings.filter((o) => o.room === 'Drawing Room' && o.kind === 'door')) {
      const onTop = door.side === 'top' && door.at > kitchen.x && door.at < kitchen.x + kitchen.width
      assert.ok(!onTop, 'not into the kitchen')
    }
    assert.ok(result.openings.some((o) => o.room === 'Drawing Room' && o.kind === 'door'))
    assert.ok(drawing)
  })
})
