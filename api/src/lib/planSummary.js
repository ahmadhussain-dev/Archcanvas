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
 * The frame that maps plan feet to editor metres: the plot's box, or the box
 * around all rooms when there is no plot.
 */
export function planFrame(floorplan) {
  const rooms = floorplan.floor?.rooms ?? []
  const plot = rooms.find((room) => room.id === 'plot')
  const boxes = plot ? [worldBox(plot)] : rooms.filter(isRect).map(worldBox)
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

  return {
    units: 'feet',
    floor: floor?.name ?? 'Ground',
    plot: frame.hasPlot ? { width: frame.widthFt, depth: frame.depthFt } : null,
    wallThicknessFt: Math.round((Number(floorplan.wallThickness) || 0.23) / FT * 100) / 100,
    rooms: rooms.map((room) => {
      const roomWalls = Object.values(room.wallIds ?? {}).map((id) => walls.get(id)).filter(Boolean)
      const openings = (floorplan.openings ?? [])
        .filter((o) => roomWalls.some((w) => w.id === o.wallId))
        .map((o) => `${o.type === 'door' ? 'door' : 'window'} ${sideOf(room, walls.get(o.wallId))}`)
      const furniture = items
        .filter((item) => item.roomId === room.id || inRoom(room, item.x, item.z))
        .map((item) => item.type)
      return {
        id: room.id,
        name: room.name || 'Room',
        ...(isRect(room) ? fromWorld(frame, room) : { shape: room.shape ?? 'custom' }),
        openings,
        furniture
      }
    })
  }
}
