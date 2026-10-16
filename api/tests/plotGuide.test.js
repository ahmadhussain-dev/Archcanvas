import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { suggestedFloor, promptIdeas } from '../src/lib/plotGuide.js'
import { layoutFloor, sharedEdge, forbiddenDoor } from '../src/lib/layoutFloor.js'
import { minSizeFor } from '../src/lib/aiPlan.js'

const wallFt = 0.75
const PLOTS = [[15, 30], [22.5, 30], [25, 45], [35, 45], [30, 60], [35, 65], [50, 90], [100, 90]]

// The room a door on `room`'s `side` wall at `at` leads into, or null.
function across(rooms, room, door) {
  return rooms.find((other) => {
    if (other === room) return false
    const edge = sharedEdge(room, other)
    return edge && edge.side === door.side && door.at >= edge.lo - 0.1 && door.at <= edge.hi + 0.1
  }) ?? null
}

describe('best plan for a plot size', () => {
  for (const [width, depth] of PLOTS) {
    for (const upstairs of [false, true]) {
      test(`${width} x ${depth} ft ${upstairs ? 'upstairs' : 'ground floor'}: every suggested room fits and has a way in`, () => {
        const plan = suggestedFloor({ widthFt: width, depthFt: depth }, { upstairs })
        const stairsBelow = upstairs ? layoutFloor({ area: { x: 0, y: 0, width, depth }, wallFt, rooms: suggestedFloor({ widthFt: width, depthFt: depth }).rooms, minSizeFor, ground: true }).rooms.find((r) => r.kind === 'staircase') : null
        const result = layoutFloor({ area: { x: 0, y: 0, width, depth }, wallFt, rooms: plan.rooms, minSizeFor, ground: !upstairs, stairsBelow })
        assert.deepEqual(result.skipped, [])
        if (!upstairs) {
          // The main door from the street opens into the porch, drawing room or lounge.
          const street = result.openings.filter((o) => o.kind === 'door' && !across(result.rooms, result.rooms.find((r) => r.name === o.room), o))
          assert.ok(street.length && street.every((o) => ['car porch', 'drawing room', 'lounge', 'terrace'].includes(result.rooms.find((r) => r.name === o.room).kind)), 'main door')
        }
        // No washroom door opens into a kitchen or dining area.
        for (const door of result.openings.filter((o) => o.kind === 'door')) {
          const room = result.rooms.find((r) => r.name === door.room)
          const other = across(result.rooms, room, door)
          if (other) assert.ok(!forbiddenDoor(room.kind, other.kind), `${room.name} does not open into ${other.name}`)
        }
      })
    }
  }

  test('names the plot in Marla or Kanal and suits the size', () => {
    assert.equal(suggestedFloor({ widthFt: 25, depthFt: 45 }).label, '5 Marla')
    assert.equal(suggestedFloor({ widthFt: 50, depthFt: 90 }).label, '1 Kanal')
    const small = suggestedFloor({ widthFt: 15, depthFt: 30 }).rooms.map((r) => r.name)
    assert.ok(!small.includes('Car Porch'), 'no car porch on 2 Marla')
    const kanal = suggestedFloor({ widthFt: 50, depthFt: 90 }).rooms.map((r) => r.name)
    assert.ok(kanal.includes('Dining') && kanal.includes('Guest Bedroom'))
  })

  test('a big ground floor keeps a back lawn instead of huge rooms', () => {
    const result = layoutFloor({ area: { x: 0, y: 0, width: 50, depth: 90 }, wallFt, rooms: suggestedFloor({ widthFt: 50, depthFt: 90 }).rooms, minSizeFor, ground: true })
    const lawn = result.rooms.find((r) => r.name === 'Back Lawn')
    assert.ok(lawn && lawn.y === 0)
    for (const room of result.rooms.filter((r) => r.kind === 'bedroom' && r.zone === 'back')) assert.ok(room.depth <= 16.01, `${room.name} is not too deep`)
  })

  test('stairs and dining open into the lounge through archways', () => {
    const result = layoutFloor({ area: { x: 0, y: 0, width: 35, depth: 65 }, wallFt, rooms: suggestedFloor({ widthFt: 35, depthFt: 65 }).rooms, minSizeFor, ground: true })
    for (const name of ['Staircase', 'Dining']) {
      const arch = result.openings.find((o) => o.room === name && o.open)
      assert.ok(arch && arch.width >= 4, `${name} has an archway`)
    }
  })

  test('ideas start with the best plan for this plot', () => {
    const ideas = promptIdeas({ plot: { widthFt: 25, depthFt: 45 } })
    assert.equal(ideas.size, '5 Marla (25 x 45 ft)')
    assert.equal(ideas.ideas[0].kind, 'best')
    assert.match(ideas.ideas[0].text, /best layout for this 5 Marla/)
    assert.ok(promptIdeas({ plot: { widthFt: 25, depthFt: 45 } }, { upstairs: true }).ideas.some((i) => /terrace/i.test(i.text)))
  })
})
