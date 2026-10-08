// Lays out a whole floor from a list of rooms, so the AI never has to do the
// arithmetic itself.
//
// The floor is cut into bands across its width, the way Pakistani houses are
// planned: the back (top of the plan), the middle (lounge, kitchen, stairs)
// and the front (bottom of the plan, the street side: car porch, drawing
// room, or a terrace upstairs). Each band is as deep as its biggest room
// needs, and the rest of the depth is shared out by the rooms' usual sizes.
// Inside a band, rooms sit side by side and share out its width the same way.
// The bands fill the whole area, so there are no gaps.
//
// Then every room gets a door into the lounge (or the room next to it that
// leads there), an attached bath opens from its bedroom, the car porch gets a
// gate, rooms on the front and back walls get windows (side walls are
// usually shared with the neighbours), and the stairs go above the stairs
// below. All sizes are in plan feet, measured on wall centre lines.
import { roomKind } from './planSummary.js'

export const ZONES = ['back', 'middle', 'front']

// Usual floor area in square feet, which decides how space is shared out.
const TARGET_AREA = {
  bedroom: 180, bathroom: 45, kitchen: 100, lounge: 260, 'drawing room': 180, dining: 130,
  'car porch': 220, store: 40, staircase: 45, 'servant room': 80, laundry: 40, study: 100, terrace: 100
}
const SIZE = { small: 0.8, normal: 1, large: 1.25 }
// Where a room goes when the AI does not say.
const DEFAULT_ZONE = {
  'car porch': 'front', 'drawing room': 'front', terrace: 'front',
  lounge: 'middle', kitchen: 'middle', dining: 'middle', staircase: 'middle'
}
// Rooms that stop growing once they reach their usual size.
const CAPPED = new Set(['bathroom', 'store', 'laundry', 'staircase'])
// Who is left out first when a floor is too small (lowest first).
const PRIORITY = ['store', 'laundry', 'study', 'dining', 'servant room', 'terrace', 'drawing room', 'car porch', 'bathroom', 'kitchen', 'bedroom', 'staircase', 'lounge']
const LIT = new Set(['bedroom', 'kitchen', 'lounge', 'drawing room', 'dining', 'study', 'servant room', 'bathroom'])

const half = (value) => Math.round(value * 2) / 2
// An attached bath counts as much as its bedroom.
const priorityOf = (item) => PRIORITY.indexOf(item.owner?.kind ?? item.kind)
// Least important first; of equals, the one listed last.
const byPriority = (a, b) => priorityOf(a) - priorityOf(b) || b.order - a.order

/**
 * @param {object} input
 * @param {{x:number,y:number,width:number,depth:number}} input.area  the plot, or the floor below's outline
 * @param {number} input.wallFt
 * @param {{name:string, zone?:string, attached_to?:string, size?:string}[]} input.rooms
 * @param {{x:number,y:number,width:number,depth:number}|null} input.stairsBelow
 * @param {boolean} input.ground  true on the ground floor (car porch gate, main entrance)
 * @param {(name:string) => {min:number[], kind:string}|null} input.minSizeFor
 * @returns {{ rooms: object[], openings: object[], skipped: {label:string, reason:string}[] }}
 */
export function layoutFloor({ area, wallFt, rooms: program, stairsBelow = null, ground = true, minSizeFor }) {
  const skipped = []
  const items = program.map((entry, order) => {
    const kind = roomKind(entry.name) ?? 'room'
    const rule = minSizeFor(entry.name)
    const min = kind === 'terrace' ? [4, 6] : kind === 'staircase' ? [3.5, 9] : rule?.min ?? [8, 8]
    return {
      name: entry.name,
      kind,
      order,
      attachedTo: entry.attached_to ?? null,
      zone: entry.zone ?? DEFAULT_ZONE[kind] ?? 'back',
      weight: (TARGET_AREA[kind] ?? 100) * (SIZE[entry.size] ?? 1),
      // Clear inside minimums turned into centre-line sizes.
      short: min[0] + wallFt,
      long: min[1] + wallFt,
      // A car porch and a staircase run front to back, so the band must take their long side.
      deep: kind === 'car porch' || kind === 'staircase'
    }
  })
  // An attached bath goes in its bedroom's band, right after it.
  for (const item of items) {
    const owner = item.attachedTo && items.find((other) => other !== item && other.name.toLowerCase() === item.attachedTo.toLowerCase())
    if (owner) { item.zone = owner.zone; item.owner = owner } else item.attachedTo = null
  }

  const drop = (item, reason) => {
    if (!items.includes(item)) return
    items.splice(items.indexOf(item), 1)
    skipped.push({ label: `Add ${item.name}`, reason })
    // A bath attached to a room that is left out goes with it.
    for (const bath of items.filter((other) => other.owner === item)) drop(bath, `${item.name} is left out.`)
  }

  rebalance(items, area.width, drop)
  const bandMin = (band) => Math.max(...band.map((item) => (item.deep ? item.long : item.short)))
  const bandsNow = () => ZONES.map((zone) => items.filter((item) => item.zone === zone)).filter((band) => band.length)

  // Depths: leave out the least important rooms until every band fits.
  let bands = bandsNow()
  while (bands.length && bands.reduce((sum, band) => sum + bandMin(band), 0) > area.depth + 0.01) {
    const victim = [...items].sort(byPriority)[0]
    drop(victim, `The floor is ${area.depth} ft deep, too shallow for all these rooms at their minimum sizes.`)
    bands = bandsNow()
  }
  if (!bands.length) return { rooms: [], openings: [], skipped }

  const depths = shareOut(area.depth, bands.map((band) => ({
    min: bandMin(band),
    // Deep enough for its rooms side by side, and for its biggest room to be roughly square.
    want: Math.max(band.reduce((sum, item) => sum + item.weight, 0) / area.width,
      ...band.filter((item) => !CAPPED.has(item.kind)).map((item) => Math.sqrt(item.weight)))
  })))
  alignStairs(bands, depths, stairsBelow, area, wallFt, bandMin)

  // Widths, band by band.
  const placed = []
  let y = area.y
  bands.forEach((band, b) => {
    const depth = depths[b]
    const ordered = orderBand(band)
    let segments = [{ x: area.x, width: area.width, items: ordered }]
    const stairs = ordered.find((item) => item.kind === 'staircase')
    if (stairs) {
      segments = stairsSegments(stairs, ordered, area, wallFt, stairsBelow, placed, y, depth)
    }
    for (const segment of segments) {
      const widths = fitWidths(segment, depth, (item, reason) => drop(item, reason))
      let x = segment.x
      segment.items.forEach((item, i) => {
        if (!widths[i]) return
        placed.push({ ...item, x, y, width: widths[i], depth })
        x += widths[i]
      })
    }
    y += depth
  })

  return { rooms: placed.map(toRoom), openings: openingsFor(placed, area, ground), skipped }
}

// A band whose rooms cannot fit side by side even at their smallest hands a
// room (with its attached bath) to a band that has the width to spare.
function rebalance(items, width, drop) {
  const need = (list) => list.reduce((sum, item) => sum + (item.kind === 'staircase' ? Math.max(4, item.short + 0.5) : item.short), 0)
  const group = (item) => [item, ...items.filter((bath) => bath.attachedTo && bath.attachedTo.toLowerCase() === item.name.toLowerCase())]
  const fixed = new Set(['lounge', 'car porch', 'staircase'])
  for (let round = 0; round < items.length; round += 1) {
    const crowded = ZONES.find((zone) => need(items.filter((item) => item.zone === zone)) > width + 0.01)
    if (!crowded) return
    const movable = items.filter((item) => item.zone === crowded && !item.attachedTo && !fixed.has(item.kind)).sort(byPriority)
    let moved = false
    for (const item of movable) {
      const rooms = group(item)
      const others = ZONES.filter((zone) => zone !== crowded)
      const target = others
        .map((zone) => ({ zone, spare: width - need(items.filter((other) => other.zone === zone)) }))
        .filter(({ spare }) => spare >= need(rooms) - 0.01)
        .sort((a, b) => b.spare - a.spare)[0]
      if (target) {
        for (const room of rooms) room.zone = target.zone
        moved = true
        break
      }
      // Else make room by leaving out less important rooms there (a drawing room before a bedroom).
      for (const zone of others) {
        const there = items.filter((other) => other.zone === zone)
        const lesser = there.filter((other) => !other.attachedTo && !fixed.has(other.kind) && priorityOf(other) < priorityOf(item)).sort(byPriority)
        const out = []
        for (const other of lesser) {
          if (width - need(there.filter((x) => !out.includes(x) && !out.includes(x.owner))) >= need(rooms) - 0.01) break
          out.push(other)
        }
        if (width - need(there.filter((x) => !out.includes(x) && !out.includes(x.owner))) < need(rooms) - 0.01) continue
        for (const other of out) drop(other, `It was left out to make space for ${item.name}.`)
        for (const room of rooms) room.zone = zone
        moved = true
        break
      }
      if (moved) break
    }
    if (!moved) return
  }
}

// Rounds sizes to half feet without going under any minimum, keeping the
// total: what rounding leaves over goes to the part `spare` names.
function roundShare(sizes, mins, total, spare) {
  const rounded = sizes.map((size, i) => Math.max(mins[i], Math.floor(size * 2 + 1e-6) / 2))
  rounded[spare] += total - rounded.reduce((a, b) => a + b, 0)
  return rounded
}

const toRoom = ({ name, kind, zone, x, y, width, depth }) => ({ name, kind, zone, x, y, width, depth })

// Shares `total` between parts that each need `min` and would like `want`:
// first up to what each wants, then the rest in proportion. Half-foot steps.
function shareOut(total, parts) {
  const sizes = parts.map((part) => part.min)
  let extra = total - sizes.reduce((a, b) => a + b, 0)
  const needs = parts.map((part, i) => Math.max(0, part.want - sizes[i]))
  const needTotal = needs.reduce((a, b) => a + b, 0)
  if (needTotal > 0) {
    const share = Math.min(1, extra / needTotal)
    needs.forEach((need, i) => { sizes[i] += need * share })
    extra -= needTotal * share
  }
  const wantTotal = parts.reduce((sum, part) => sum + part.want, 0) || parts.length
  parts.forEach((part, i) => { sizes[i] += extra * ((part.want || 1) / wantTotal) })
  // The deepest band takes what rounding leaves over.
  return roundShare(sizes, parts.map((part) => part.min), total, sizes.indexOf(Math.max(...sizes)))
}

// Upstairs, the middle band moves so the staircase sits over the stairs below.
function alignStairs(bands, depths, stairsBelow, area, wallFt, bandMin) {
  if (!stairsBelow) return
  const m = bands.findIndex((band) => band.some((item) => item.kind === 'staircase'))
  if (m < 0) return
  const top = area.y + depths.slice(0, m).reduce((a, b) => a + b, 0)
  const wantTop = stairsBelow.y - wallFt / 2
  const wantBottom = stairsBelow.y + stairsBelow.depth + wallFt / 2
  if (m > 0 && wantTop < top) {
    const give = Math.min(top - wantTop, depths[m - 1] - bandMin(bands[m - 1]))
    const step = Math.floor(give * 2) / 2
    if (step > 0) { depths[m - 1] -= step; depths[m] += step }
  }
  const bottom = area.y + depths.slice(0, m + 1).reduce((a, b) => a + b, 0)
  if (m < bands.length - 1 && wantBottom > bottom) {
    const give = Math.min(wantBottom - bottom, depths[m + 1] - bandMin(bands[m + 1]))
    const step = Math.floor(give * 2) / 2
    if (step > 0) { depths[m + 1] -= step; depths[m] += step }
  }
}

// The band's rooms left to right: in the AI's order, each attached bath right after its bedroom.
function orderBand(band) {
  const free = band.filter((item) => !item.attachedTo).sort((a, b) => a.order - b.order)
  const out = []
  for (const item of free) {
    out.push(item)
    out.push(...band.filter((bath) => bath.attachedTo && bath.attachedTo.toLowerCase() === item.name.toLowerCase()))
  }
  return out
}

// Splits a band around its staircase: over the stairs below upstairs, at the
// left on the ground floor. A sliver too narrow for a room joins the stair hall.
function stairsSegments(stairs, ordered, area, wallFt, stairsBelow, placed, y, depth) {
  const others = ordered.filter((item) => item !== stairs)
  let width = Math.max(4, stairs.short + 0.5)
  let x = area.x
  if (stairsBelow) {
    width = Math.max(width, half(stairsBelow.width + wallFt))
    x = Math.min(Math.max(area.x, half(stairsBelow.x - wallFt / 2)), area.x + area.width - width)
  }
  let left = { x: area.x, width: x - area.x, items: [] }
  let right = { x: x + width, width: area.x + area.width - (x + width), items: [] }
  const smallest = Math.min(...others.map((item) => item.short), Infinity)
  if (left.width < smallest) { x = area.x; width += left.width; left = { ...left, width: 0 } }
  if (right.width < smallest) { width += right.width; right = { x: x + width, width: 0, items: [] } }
  // The lounge and everything else go to the wider side; a room that fits goes to the narrow one.
  const [wide, narrow] = left.width >= right.width ? [left, right] : [right, left]
  for (const item of others) {
    const fitsNarrow = narrow.width > 0 && !narrow.items.length && item.kind !== 'lounge' && narrow.width >= item.short
    ;(fitsNarrow ? narrow : wide).items.push(item)
  }
  placed.push({ ...stairs, x, y, width, depth })
  return [left, right].filter((segment) => segment.width > 0 && segment.items.length)
}

// Widths for the rooms of one segment of a band `depth` deep.
function fitWidths(segment, depth, drop) {
  const items = segment.items
  const minOf = (item) => (item.deep || depth >= item.long ? item.short : item.long)
  while (items.length && items.reduce((sum, item) => sum + minOf(item), 0) > segment.width + 0.01) {
    const victim = [...items].sort(byPriority)[0]
    const gone = [victim, ...items.filter((item) => item.owner === victim)]
    for (const item of gone) items.splice(items.indexOf(item), 1)
    drop(victim, `There is no width left for it next to ${items.map((item) => item.name).join(', ') || 'the other rooms'}.`)
  }
  if (!items.length) return []
  const parts = items.map((item) => {
    const want = item.weight / depth
    return { min: minOf(item), want, cap: CAPPED.has(item.kind) ? Math.max(minOf(item), want) : Infinity }
  })
  const widths = parts.map((part) => part.min)
  let extra = segment.width - widths.reduce((a, b) => a + b, 0)
  // Up to the usual size first, then the rooms that can keep growing.
  const needs = parts.map((part, i) => Math.max(0, Math.min(part.want, part.cap) - widths[i]))
  const needTotal = needs.reduce((a, b) => a + b, 0)
  if (needTotal > 0) {
    const share = Math.min(1, extra / needTotal)
    needs.forEach((need, i) => { widths[i] += need * share })
    extra -= needTotal * share
  }
  const growers = parts.map((part, i) => (part.cap === Infinity ? i : -1)).filter((i) => i >= 0)
  const pool = growers.length ? growers : parts.map((_, i) => i)
  const poolWeight = pool.reduce((sum, i) => sum + items[i].weight, 0)
  pool.forEach((i) => { widths[i] += extra * (items[i].weight / poolWeight) })
  return roundShare(widths, parts.map((part) => part.min), segment.width, pool[0])
}

// Shared stretch of two rooms' edges, or null: the side of `a` it is on and where along it.
function sharedEdge(a, b) {
  const near = (p, q) => Math.abs(p - q) < 0.05
  const span = (lo1, hi1, lo2, hi2) => [Math.max(lo1, lo2), Math.min(hi1, hi2)]
  if (near(a.y, b.y + b.depth) || near(a.y + a.depth, b.y)) {
    const [lo, hi] = span(a.x, a.x + a.width, b.x, b.x + b.width)
    if (hi - lo >= 3.5) return { side: near(a.y, b.y + b.depth) ? 'top' : 'bottom', lo, hi }
  }
  if (near(a.x, b.x + b.width) || near(a.x + a.width, b.x)) {
    const [lo, hi] = span(a.y, a.y + a.depth, b.y, b.y + b.depth)
    if (hi - lo >= 3.5) return { side: near(a.x, b.x + b.width) ? 'left' : 'right', lo, hi }
  }
  return null
}

function openingsFor(rooms, area, ground) {
  const openings = []
  const door = (room, side, at, width) => openings.push({ room: room.name, kind: 'door', side, at: Math.round(at * 10) / 10, ...(width ? { width } : {}) })
  const hub = rooms.find((r) => r.kind === 'lounge')
    ?? rooms.find((r) => r.kind === 'drawing room')
    ?? rooms.find((r) => r.zone === 'middle' && r.kind !== 'bathroom')
    ?? null
  // Doors open near the corner of the shared stretch closest to the middle of the hub.
  const doorAt = (edge) => {
    if (edge.hi - edge.lo < 6 || !hub) return (edge.lo + edge.hi) / 2
    const centre = ['top', 'bottom'].includes(edge.side) ? hub.x + hub.width / 2 : hub.y + hub.depth / 2
    return Math.abs(edge.lo - centre) < Math.abs(edge.hi - centre) ? edge.lo + 2 : edge.hi - 2
  }
  for (const room of rooms) {
    if (room === hub) continue
    const owner = room.attachedTo && rooms.find((r) => r.name.toLowerCase() === room.attachedTo.toLowerCase())
    const edgeTo = (other) => (other ? sharedEdge(room, other) : null)
    let edge = edgeTo(owner)
    if (!edge) edge = edgeTo(hub)
    if (!edge) {
      // Through a room that leads on: the stairs, the lounge side of the house.
      // A kitchen or dining room only when nothing else touches it.
      const through = rooms
        .filter((other) => other !== room && !['bathroom', 'store', 'laundry'].includes(other.kind) && !other.attachedTo)
        .filter((other) => other.zone === 'middle' || other.kind === 'staircase')
        // Guests do not walk through the kitchen: a drawing room keeps just its front door.
        .filter((other) => !(room.kind === 'drawing room' && ['kitchen', 'dining'].includes(other.kind)))
        .sort((a, b) => ['kitchen', 'dining'].includes(a.kind) - ['kitchen', 'dining'].includes(b.kind))
      for (const other of through) { edge = edgeTo(other); if (edge) break }
    }
    if (edge) door(room, edge.side, doorAt(edge))
  }
  const bottom = area.y + area.depth
  const front = rooms.filter((r) => Math.abs(r.y + r.depth - bottom) < 0.05)
  if (ground) {
    // The way in from the street: the car porch gate, else the front room, else the lounge.
    const porch = front.find((r) => r.kind === 'car porch')
    const entry = porch ?? front.find((r) => r.kind === 'drawing room' || r.kind === 'lounge')
      ?? front.find((r) => !['bedroom', 'bathroom', 'servant room', 'store'].includes(r.kind))
    if (entry) door(entry, 'bottom', entry.x + entry.width / 2, porch ? Math.min(10, entry.width - 3) : undefined)
    // A drawing room has its own door for guests, from the porch or the street.
    const drawing = rooms.find((r) => r.kind === 'drawing room' && r !== entry)
    const guestEdge = drawing && porch && sharedEdge(drawing, porch)
    if (guestEdge) door(drawing, guestEdge.side, guestEdge.lo + (guestEdge.hi - guestEdge.lo) * 0.7)
    else if (drawing && front.includes(drawing)) door(drawing, 'bottom', drawing.x + drawing.width / 2)
  }
  for (const room of rooms) {
    if (!LIT.has(room.kind)) continue
    if (Math.abs(room.y - area.y) < 0.05) openings.push({ room: room.name, kind: 'window', side: 'top' })
    else if (Math.abs(room.y + room.depth - bottom) < 0.05) openings.push({ room: room.name, kind: 'window', side: 'bottom' })
  }
  return openings
}
