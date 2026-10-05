// Turns an editor building file into a short plan the AI can read, in feet.
//
// Plan space: the origin is the plot's top-left corner as seen on the 2D plan,
// x runs right and y runs down (towards the bottom of the plan). A room is
// { x, y, width, depth }: its top-left corner and size, measured on the wall
// centre lines, so neighbouring rooms share an edge.
//
// The editor works in metres with a room's x/z at its centre, and the 2D plan
// draws +z at the top. toWorld/fromWorld convert between the two.
export const FT = 0.3048

const round1 = (value) => Math.round(value * 10) / 10 + 0 // + 0 turns -0 into 0

export function floorplanOf(building) {
  const data = typeof building === 'string' ? JSON.parse(building) : building
  if (data?.floorplan?.floor) return data.floorplan
  if (data?.floor?.rooms) return data
  throw new Error('Not a building file')
}

// Kinds of room ArchCanvas can furnish with a full set (engine/src/ai/roomKits.js).
export const ROOM_KINDS = [
  ['staircase', /stair/i],
  ['bathroom', /bath|wash\s*room|toilet|\bwc\b|powder|rest\s*room/i],
  ['kitchen', /kitchen/i],
  ['dining', /dining/i],
  ['car porch', /porch|garage|parking|\bcar\b/i],
  ['servant room', /servant|maid|driver/i],
  ['laundry', /laundry/i],
  ['store', /store|pantry/i],
  ['study', /study|office|library/i],
  ['lounge', /\btv\b|lounge|living|family|sitting/i],
  ['drawing room', /drawing|baithak/i],
  ['bedroom', /bed\s*room|master|guest|kids?\b|children|nursery/i]
]

export function roomKind(name) {
  return ROOM_KINDS.find(([, match]) => match.test(String(name || '')))?.[0] ?? null
}

const isRect = (room) => (room.shape ?? 'square') === 'square' && !Number(room.rotation)

function worldBox(room) {
  return {
    minX: room.x - room.width / 2,
    maxX: room.x + room.width / 2,
    minZ: room.z - room.depth / 2,
    maxZ: room.z + room.depth / 2
  }
}

/**
 * The frame that maps plan feet to editor metres: the plot's box, grown to
 * take in any room (on any floor) that sticks out of it, or the box around
 * all rooms when there is no plot. A plot that was shrunk by mistake must not
 * make every room look like it is outside.
 */
export function planFrame(floorplan) {
  const rooms = floorplan.floor?.rooms ?? []
  const plot = rooms.find((room) => room.id === 'plot')
  const boxes = rooms.filter((room) => room === plot || isRect(room)).map(worldBox)
  if (!boxes.length) return { minX: 0, maxZ: 0, widthFt: null, depthFt: null, hasPlot: false }
  const minX = Math.min(...boxes.map((b) => b.minX))
  const maxX = Math.max(...boxes.map((b) => b.maxX))
  const minZ = Math.min(...boxes.map((b) => b.minZ))
  const maxZ = Math.max(...boxes.map((b) => b.maxZ))
  return { minX, maxZ, widthFt: round1((maxX - minX) / FT), depthFt: round1((maxZ - minZ) / FT), hasPlot: !!plot }
}

export function fromWorld(frame, room) {
  const box = worldBox(room)
  return {
    x: round1((box.minX - frame.minX) / FT),
    y: round1((frame.maxZ - box.maxZ) / FT),
    width: round1(room.width / FT),
    depth: round1(room.depth / FT)
  }
}

export function toWorld(frame, rect) {
  const r3 = (value) => Math.round(value * 1000) / 1000
  return {
    x: r3(frame.minX + (rect.x + rect.width / 2) * FT),
    z: r3(frame.maxZ - (rect.y + rect.depth / 2) * FT),
    width: r3(rect.width * FT),
    depth: r3(rect.depth * FT)
  }
}

function sideOf(room, wall) {
  const [x1, z1] = wall.from
  const [x2, z2] = wall.to
  if (Math.abs(z2 - z1) < Math.abs(x2 - x1)) return (z1 + z2) / 2 > room.z ? 'top' : 'bottom'
  return (x1 + x2) / 2 > room.x ? 'right' : 'left'
}

const inRoom = (room, x, z) => {
  const b = worldBox(room)
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ
}

// Where an opening leads: the room on the other side of its wall, or outside.
function leadsTo(room, wall, opening, others) {
  const [x1, z1] = wall.from
  const [x2, z2] = wall.to
  const x = x1 + (x2 - x1) * opening.t
  const z = z1 + (z2 - z1) * opening.t
  const horizontal = Math.abs(z2 - z1) < Math.abs(x2 - x1)
  const out = horizontal ? [0, z > room.z ? 1 : -1] : [x > room.x ? 1 : -1, 0]
  const probe = { x: x + out[0] * 0.6, z: z + out[1] * 0.6 }
  const other = others.find((candidate) => candidate.id !== room.id && isRect(candidate) && inRoom(candidate, probe.x, probe.z))
  return other ? other.name || 'Room' : 'outside'
}

/** The current floor as the AI sees it. */
export function summarizePlan(building) {
  const floorplan = floorplanOf(building)
  const floorId = floorplan.currentFloorId ?? 'floor_1'
  const floor = (floorplan.floors ?? []).find((f) => f.id === floorId)
  const frame = planFrame(floorplan)
  const onFloor = (entity) => (entity.floorId ?? 'floor_1') === floorId
  const walls = new Map((floorplan.walls ?? []).map((wall) => [wall.id, wall]))
  const rooms = (floorplan.floor?.rooms ?? []).filter((room) => room.id !== 'plot' && onFloor(room))
  const items = (floorplan.items ?? []).filter(onFloor)
  const stairsOf = (entities) => entities.map((stairs) => {
    const turned = Math.round((Number(stairs.rotation) || 0) / (Math.PI / 2)) % 2 !== 0
    return fromWorld(frame, turned ? { ...stairs, width: stairs.depth, depth: stairs.width } : stairs)
  })

  // On an upper floor the rooms go over the floor below, so the AI sees its outline and stairs.
  const levels = [...(floorplan.floors ?? [])].sort((a, b) => Number(a.level || 0) - Number(b.level || 0))
  const below = levels[levels.findIndex((f) => f.id === floorId) - 1]
  let floorBelow = null
  if (below) {
    const onBelow = (entity) => (entity.floorId ?? 'floor_1') === below.id
    const belowRooms = (floorplan.floor?.rooms ?? []).filter((room) => room.id !== 'plot' && onBelow(room) && isRect(room))
    if (belowRooms.length) {
      const rects = belowRooms.map((room) => fromWorld(frame, room))
      const x = Math.min(...rects.map((r) => r.x))
      const y = Math.min(...rects.map((r) => r.y))
      floorBelow = {
        name: below.name ?? 'Ground',
        outline: { x, y, width: round1(Math.max(...rects.map((r) => r.x + r.width)) - x), depth: round1(Math.max(...rects.map((r) => r.y + r.depth)) - y) },
        rooms: belowRooms.map((room, i) => ({ name: room.name || 'Room', ...rects[i] })),
        stairs: stairsOf((floorplan.stairs ?? []).filter(onBelow))
      }
    }
  }

  return {
    units: 'feet',
    floor: floor?.name ?? 'Ground',
    plot: frame.hasPlot ? { width: frame.widthFt, depth: frame.depthFt } : null,
    wallThicknessFt: Math.round((Number(floorplan.wallThickness) || 0.23) / FT * 100) / 100,
    stairs: stairsOf((floorplan.stairs ?? []).filter(onFloor)),
    ...(floorBelow ? { floorBelow } : {}),
    rooms: rooms.map((room) => {
      const roomWalls = Object.values(room.wallIds ?? {}).map((id) => walls.get(id)).filter(Boolean)
      const openings = (floorplan.openings ?? [])
        .filter((o) => roomWalls.some((w) => w.id === o.wallId))
        .map((o) => {
          const wall = walls.get(o.wallId)
          const kind = o.type === 'door' ? 'door' : 'window'
          return `${kind} ${sideOf(room, wall)}${kind === 'door' ? ` to ${leadsTo(room, wall, o, rooms)}` : ''}`
        })
      const furniture = items
        .filter((item) => item.roomId === room.id || inRoom(room, item.x, item.z))
        .map((item) => item.type)
      const kind = roomKind(room.name)
      return {
        id: room.id,
        name: room.name || 'Room',
        ...(kind ? { kind } : {}),
        ...(isRect(room) ? fromWorld(frame, room) : { shape: room.shape ?? 'custom' }),
        openings,
        furniture
      }
    })
  }
}
