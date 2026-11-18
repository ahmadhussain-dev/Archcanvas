// A light drawing of a building file for template cards and preview pages:
// walls, doors, windows, rooms, stairs and furniture outlines for each floor,
// in plan feet (origin at the plot's top-left, x to the right, y down towards
// the road, the same plan space as planSummary.js). The web app draws it as
// an SVG, so a preview needs no 3D engine.
import { FT, floorplanOf, planFrame } from './planSummary.js'

const r2 = (value) => Math.round(value * 100) / 100

export function planPreview(building) {
  const floorplan = floorplanOf(building)
  const frame = planFrame(floorplan)
  const px = (x) => r2((x - frame.minX) / FT)
  const py = (z) => r2((frame.maxZ - z) / FT)
  const box = (x, z, width, depth, rotation = 0) => {
    // Furniture and stairs turn in steps of 90 degrees, so a box is enough.
    const quarter = Math.round(Math.abs(Number(rotation) || 0) / (Math.PI / 2)) % 2 === 1
    const w = (quarter ? depth : width) / FT
    const d = (quarter ? width : depth) / FT
    return { x: r2(px(x) - w / 2), y: r2(py(z) - d / 2), width: r2(w), depth: r2(d) }
  }
  const levels = [...(floorplan.floors ?? [{ id: 'floor_1', name: 'Ground', level: 0 }])]
    .sort((a, b) => Number(a.level || 0) - Number(b.level || 0))
  const walls = new Map((floorplan.walls ?? []).map((wall) => [wall.id, wall]))
  const plot = (floorplan.floor?.rooms ?? []).find((room) => room.id === 'plot')

  const floors = levels.map((level) => {
    const on = (entity) => (entity.floorId ?? 'floor_1') === level.id
    const rooms = (floorplan.floor?.rooms ?? []).filter((room) => room.id !== 'plot' && on(room))
    return {
      id: level.id,
      name: level.name ?? 'Floor',
      rooms: rooms.map((room) => ({ name: room.name || 'Room', ...box(room.x, room.z, room.width, room.depth) })),
      walls: (floorplan.walls ?? [])
        .filter((wall) => on(wall) && wall.roomId !== 'plot')
        .map((wall) => ({
          x1: px(wall.from[0]), y1: py(wall.from[1]), x2: px(wall.to[0]), y2: py(wall.to[1]),
          t: r2((Number(wall.thickness) || 0.23) / FT),
          ...(wall.height ? { low: true } : {})
        })),
      openings: (floorplan.openings ?? []).flatMap((opening) => {
        const wall = walls.get(opening.wallId)
        if (!wall || !on(wall)) return []
        const [x1, z1] = wall.from
        const [x2, z2] = wall.to
        return [{
          type: opening.type === 'door' ? (opening.panelHidden ? 'arch' : 'door') : 'window',
          x: px(x1 + (x2 - x1) * opening.t),
          y: py(z1 + (z2 - z1) * opening.t),
          along: Math.abs(x2 - x1) >= Math.abs(z2 - z1) ? 'x' : 'y',
          width: r2((Number(opening.width) || 0.9) / FT),
          t: r2((Number(wall.thickness) || 0.23) / FT)
        }]
      }),
      stairs: (floorplan.stairs ?? []).filter(on).map((s) => ({ ...box(s.x, s.z, s.width, s.depth, s.rotation), steps: s.steps ?? 16, along: Math.round(Math.abs(Number(s.rotation) || 0) / (Math.PI / 2)) % 2 === 1 ? 'x' : 'y' })),
      items: (floorplan.items ?? []).filter(on).map((item) => ({ type: item.type, ...box(item.x, item.z, item.width ?? 0.5, item.depth ?? 0.5, item.rotation) }))
    }
  })
  return {
    width: plot ? r2(plot.width / FT) : frame.widthFt,
    depth: plot ? r2(plot.depth / FT) : frame.depthFt,
    floors
  }
}
