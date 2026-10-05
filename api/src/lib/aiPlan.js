// "Ask ArchCanvas": the prompt sent to the AI, and the checks on its answer.
//
// The AI answers with a message and a list of changes in plan feet (see
// planSummary.js). Every change is checked here before the editor sees it:
// rooms must stay inside the plot, must not overlap, and must meet real
// minimum sizes. Changes that fail are dropped with a reason the person can
// read. What passes is converted to editor operations in metres
// (engine/src/ai/applyAiPlan.js).
import { z } from 'zod'
import { planFrame, floorplanOf, fromWorld, toWorld, ROOM_KINDS, roomKind } from './planSummary.js'

// Smallest clear inside size (between wall faces) for each kind of room, in
// feet as [short side, long side]. Pakistani house planning rules of thumb.
export const MIN_ROOM_SIZES = [
  { kind: 'bedroom', match: /bed\s*room|master|guest\s*room|kids?\s*room|children/i, min: [10, 10] },
  { kind: 'drawing room', match: /drawing|living|lounge|tv|family|sitting/i, min: [10, 12] },
  { kind: 'dining room', match: /dining/i, min: [8, 10] },
  { kind: 'kitchen', match: /kitchen/i, min: [7, 8] },
  { kind: 'bathroom', match: /bath|wash\s*room|toilet|\bwc\b|powder/i, min: [5, 6] },
  { kind: 'car porch', match: /porch|garage|parking/i, min: [10, 16] },
  { kind: 'servant room', match: /servant|maid|driver/i, min: [8, 8] },
  { kind: 'store', match: /store|pantry|laundry/i, min: [4, 4] },
  { kind: 'staircase', match: /stair/i, min: [3.5, 9] }
]

// Floor finishes the AI may choose (ids from the editor's material catalog).
export const FLOOR_MATERIALS = {
  'wood-plank-oak-light': 'Oak plank',
  'wood-herringbone-oak-light': 'Herringbone parquet',
  'wood-chevron-oak-light': 'Chevron oak',
  'brick-marble-warm': 'Warm marble tile',
  'brick-grey-gloss-marble': 'Grey gloss marble',
  'brick-marble-tiles': 'White marble tiles',
  'brick-square': 'Square tile',
  'brick-black-white': 'Black and white tile',
  'brick-mosaic': 'Mosaic tile',
  'stone-terrazzo': 'Terrazzo',
  'stone-natural': 'Natural stone'
}

// Furniture the AI may add (editor furniture types).
export const FURNITURE = {
  bed_double: 'Double bed', bed_single: 'Single bed', bunk_bed: 'Bunk bed', crib: 'Baby cot',
  wardrobe: 'Wardrobe', nightstand: 'Side table (bed)', chest_drawers: 'Chest of drawers', vanity: 'Dressing table',
  desk: 'Desk', computer_desk: 'Computer desk', officechair: 'Office chair', chair: 'Chair', bookshelf: 'Bookshelf',
  sofa: 'Sofa (3 seat)', loveseat: 'Sofa (2 seat)', armchair: 'Armchair', coffee_table: 'Coffee table',
  side_table: 'Side table', console_table: 'Console table', sideboard: 'Sideboard', display_cabinet: 'Showcase',
  dining_table_long: 'Dining table (6 seat)', round_table: 'Round dining table', table: 'Small table',
  cabinet_kitchen: 'Kitchen cabinet', sink_kitchen: 'Kitchen sink', stove: 'Cooking range', fridge: 'Fridge',
  microwave: 'Microwave', dishwasher: 'Dishwasher', water_dispenser: 'Water dispenser',
  toilet: 'Toilet (commode)', sink_bathroom: 'Wash basin', shower_cabin: 'Shower', bathtub: 'Bathtub',
  bathroom_shelf: 'Bathroom shelf', shoerack: 'Shoe rack'
}

const SIDES = ['top', 'right', 'bottom', 'left']
const TOLERANCE = 0.05 // feet

export function minSizeFor(name) {
  return MIN_ROOM_SIZES.find((rule) => rule.match.test(String(name))) ?? null
}

export function buildMessages({ summary, prompt, project }) {
  const system = `You are ArchCanvas, a house planning assistant for Pakistani homes (plots in Marla and Kanal).
You change the person's 2D floor plan by returning JSON only, no other text.

Plan coordinates are in feet. The origin is the plot's top-left corner on the 2D plan; x runs right, y runs down.
A room is a rectangle {x, y, width, depth}: its top-left corner and size measured on wall centre lines.
Neighbouring rooms share an edge (one room's x + width equals the next room's x). Walls are ${summary.wallThicknessFt} ft thick, so a room's clear inside size is ${summary.wallThicknessFt} ft less each way.

Rules:
- Rooms must stay inside the plot and must never overlap other rooms. Leave the plot boundary itself alone.
- Respect minimum clear inside sizes (feet): ${MIN_ROOM_SIZES.map((r) => `${r.kind} ${r.min[0]}x${r.min[1]}`).join(', ')}.
- Use the space sensibly: the front of the house is the bottom of the plan. Car porch at the front with the main gate, the main entrance door from the porch or front into the lounge or drawing room, bathrooms next to bedrooms (attached baths open from the bedroom), kitchen next to the dining area or lounge.
- Every room needs a door. Each room's "openings" says where its doors lead ("door bottom to TV Lounge", "door right to outside"). A bedroom, kitchen or bathroom door should lead into the lounge, a corridor or its bedroom, not outside. Add missing doors before furnishing.
- To furnish, decorate, style or "complete" a room, use furnish_room. It installs the complete, properly arranged set for the room's kind, sized to the room and kept clear of its doors, windows and stairs:
  kitchen: counter with sink (under the window), cooking range, cabinets, fridge, microwave, cooker hood; bathroom: shower, commode, wash basin with mirror, towel rail; bedroom: bed with two side tables, wardrobe, dressing table, AC (and a study desk when large); lounge: sofas facing a TV unit with TV, centre table, rug, AC; drawing room: sofa set, centre table, showcase; dining: table with chairs, sideboard; car porch: kept clear for the car, planters, shoe rack.
  It replaces the room's old furniture. When asked to furnish or style the whole house, furnish every room. Use add_furniture only for extra single pieces.
- Order the operations: rooms first, then doors and windows, then furnish_room, then floors and paint.
- Do not put rooms or furniture over the stairs ("stairs" in the plan).
- If a request cannot fit (for example 5 bedrooms on a 2 Marla plot), do not squeeze rooms below the minimums. Refuse, or do the best fit and say what you left out and why.
- Only use the operations, floor ids and furniture types listed here. Refer to existing rooms by their id; refer to rooms you add in this answer by their name.
- Keep "message" short and friendly (1 to 3 sentences, plain English).

Operations:
{"op":"add_room","name":"Bedroom 2","x":0,"y":0,"width":12,"depth":13}
{"op":"update_room","room":"<id>","name":"...","x":0,"y":0,"width":12,"depth":13}  (give only what changes)
{"op":"delete_room","room":"<id>"}
{"op":"set_floor","room":"<id>","material":"<floor id>"}
{"op":"paint_walls","room":"<id>","color":"#rrggbb"}
{"op":"add_furniture","room":"<id>","type":"<furniture type>","count":1}   (placed automatically along the walls)
{"op":"furnish_room","room":"<id>"}   (add "as":"<kind>" when the name does not say the kind; kinds: ${ROOM_KINDS.map(([kind]) => kind).join(', ')})
{"op":"remove_furniture","room":"<id>","type":"<furniture type, or omit for all>"}
{"op":"add_door","room":"<id>","side":"top|right|bottom|left"}
{"op":"add_window","room":"<id>","side":"top|right|bottom|left"}

Floor ids: ${Object.entries(FLOOR_MATERIALS).map(([id, name]) => `${id} (${name})`).join(', ')}.
Furniture types: ${Object.entries(FURNITURE).map(([id, name]) => `${id} (${name})`).join(', ')}.

Answer format:
{"message":"...","refused":false,"operations":[...]}`

  const user = `Project: ${project.name}, ${project.city}. Plot ${project.plot.widthFt} x ${project.plot.depthFt} ft, ${project.floors} floor(s).
Current plan (${summary.floor} floor):
${JSON.stringify(summary)}

Request: ${prompt}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]
}

const replySchema = z.object({
  message: z.string().trim().max(1500).default(''),
  refused: z.boolean().optional().default(false),
  operations: z.array(z.record(z.string(), z.unknown())).max(60).optional().default([])
})

/** Parses the AI's text into { message, refused, operations }, or throws. */
export function parseReply(text) {
  const cleaned = String(text ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('The AI answer was not JSON')
  return replySchema.parse(JSON.parse(cleaned.slice(start, end + 1)))
}

const num = z.coerce.number().finite()
const opSchemas = {
  add_room: z.object({ name: z.string().trim().min(1).max(40), x: num, y: num, width: num.positive(), depth: num.positive() }),
  update_room: z.object({ room: z.string(), name: z.string().trim().min(1).max(40).optional(), x: num.optional(), y: num.optional(), width: num.positive().optional(), depth: num.positive().optional() }),
  delete_room: z.object({ room: z.string() }),
  set_floor: z.object({ room: z.string(), material: z.enum(Object.keys(FLOOR_MATERIALS)) }),
  paint_walls: z.object({ room: z.string(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }),
  add_furniture: z.object({ room: z.string(), type: z.enum(Object.keys(FURNITURE)), count: z.coerce.number().int().min(1).max(8).optional() }),
  furnish_room: z.object({ room: z.string(), as: z.enum(ROOM_KINDS.map(([kind]) => kind)).optional() }),
  remove_furniture: z.object({ room: z.string(), type: z.enum(Object.keys(FURNITURE)).optional() }),
  add_door: z.object({ room: z.string(), side: z.enum(SIDES) }),
  add_window: z.object({ room: z.string(), side: z.enum(SIDES) })
}

const fmt = (value) => `${Math.round(value * 10) / 10}`
const overlaps = (a, b) =>
  a.x < b.x + b.width - TOLERANCE && b.x < a.x + a.width - TOLERANCE &&
  a.y < b.y + b.depth - TOLERANCE && b.y < a.y + a.depth - TOLERANCE

/**
 * Checks the AI's operations against the plan and converts the good ones to
 * editor operations. Returns { operations, skipped }: each operation has a
 * `label`, each skipped entry has { label, reason }.
 */
export function checkOperations(building, rawOperations, { idPrefix = `ai${Date.now().toString(36)}` } = {}) {
  const floorplan = floorplanOf(building)
  const frame = planFrame(floorplan)
  const wallFt = (Number(floorplan.wallThickness) || 0.23) / 0.3048
  const floorId = floorplan.currentFloorId ?? 'floor_1'
  const rooms = new Map()
  for (const room of floorplan.floor?.rooms ?? []) {
    if (room.id === 'plot' || (room.floorId ?? 'floor_1') !== floorId) continue
    const rect = (room.shape ?? 'square') === 'square' && !Number(room.rotation) ? fromWorld(frame, room) : null
    rooms.set(room.id, { id: room.id, name: room.name || 'Room', rect })
  }
  const operations = []
  const skipped = []
  let added = 0

  const findRoom = (ref) => {
    if (rooms.has(ref)) return rooms.get(ref)
    const lower = String(ref).trim().toLowerCase()
    return [...rooms.values()].find((room) => room.name.toLowerCase() === lower) ?? null
  }

  // Why a room rectangle is not allowed, or null.
  const problem = (name, rect, selfId) => {
    if (frame.hasPlot && (rect.x < -TOLERANCE || rect.y < -TOLERANCE ||
        rect.x + rect.width > frame.widthFt + TOLERANCE || rect.y + rect.depth > frame.depthFt + TOLERANCE)) {
      return `${name} would go outside the ${fmt(frame.widthFt)} x ${fmt(frame.depthFt)} ft plot.`
    }
    const rule = minSizeFor(name)
    if (rule) {
      const clear = [rect.width - wallFt, rect.depth - wallFt].sort((a, b) => a - b)
      if (clear[0] < rule.min[0] - TOLERANCE || clear[1] < rule.min[1] - TOLERANCE) {
        return `${name} would be ${fmt(clear[0])} x ${fmt(clear[1])} ft inside; a ${rule.kind} needs at least ${rule.min[0]} x ${rule.min[1]} ft.`
      }
    }
    const hit = [...rooms.values()].find((room) => room.id !== selfId && room.rect && overlaps(rect, room.rect))
    if (hit) return `${name} would overlap ${hit.name}.`
    return null
  }

  for (const raw of rawOperations) {
    const kind = String(raw?.op ?? '')
    const schema = opSchemas[kind]
    const parsed = schema?.safeParse(raw)
    if (!parsed?.success) {
      skipped.push({ label: kind ? kind.replace(/_/g, ' ') : 'Unknown change', reason: 'The AI asked for something the editor cannot do.' })
      continue
    }
    const op = parsed.data

    if (kind === 'add_room') {
      const rect = { x: op.x, y: op.y, width: op.width, depth: op.depth }
      const label = `Add ${op.name} (${fmt(op.width - wallFt)} x ${fmt(op.depth - wallFt)} ft inside)`
      const why = problem(op.name, rect)
      if (why) { skipped.push({ label, reason: why }); continue }
      added += 1
      const id = `${idPrefix}_${added}`
      rooms.set(id, { id, name: op.name, rect })
      operations.push({ op: 'add_room', id, name: op.name, ...toWorld(frame, rect), label })
      continue
    }

    const room = findRoom(op.room)
    if (!room) {
      skipped.push({ label: `${kind.replace(/_/g, ' ')} in "${op.room}"`, reason: 'That room is not on this floor.' })
      continue
    }

    switch (kind) {
      case 'update_room': {
        const changes = []
        if (op.name && op.name !== room.name) changes.push(`rename to ${op.name}`)
        const geometry = ['x', 'y', 'width', 'depth'].some((key) => op[key] !== undefined)
        if (geometry && !room.rect) {
          skipped.push({ label: `Change ${room.name}`, reason: `${room.name} is not a plain rectangle, so it can only be renamed.` })
          continue
        }
        const rect = room.rect ? { ...room.rect } : null
        if (geometry) {
          for (const key of ['x', 'y', 'width', 'depth']) if (op[key] !== undefined) rect[key] = op[key]
          if (rect.width !== room.rect.width || rect.depth !== room.rect.depth) changes.push(`resize to ${fmt(rect.width - wallFt)} x ${fmt(rect.depth - wallFt)} ft inside`)
          if (rect.x !== room.rect.x || rect.y !== room.rect.y) changes.push('move')
        }
        if (!changes.length) continue
        const label = `${room.name}: ${changes.join(', ')}`
        const why = rect ? problem(op.name ?? room.name, rect, room.id) : null
        if (why) { skipped.push({ label, reason: why }); continue }
        const out = { op: 'update_room', room: room.id, label }
        if (op.name) out.name = op.name
        if (geometry) Object.assign(out, toWorld(frame, rect))
        if (op.name) room.name = op.name
        if (rect) room.rect = rect
        operations.push(out)
        break
      }
      case 'delete_room':
        rooms.delete(room.id)
        operations.push({ op: 'delete_room', room: room.id, label: `Remove ${room.name}` })
        break
      case 'set_floor':
        operations.push({ op: 'set_floor', room: room.id, material: op.material, label: `${FLOOR_MATERIALS[op.material]} floor in ${room.name}` })
        break
      case 'paint_walls':
        operations.push({ op: 'paint_walls', room: room.id, color: op.color.toLowerCase(), label: `Paint ${room.name} walls ${op.color.toLowerCase()}` })
        break
      case 'add_furniture': {
        const count = op.count ?? 1
        operations.push({ op: 'add_furniture', room: room.id, type: op.type, count, label: `Add ${count > 1 ? `${count} x ` : ''}${FURNITURE[op.type]} to ${room.name}` })
        break
      }
      case 'furnish_room': {
        const kind = op.as ?? roomKind(room.name)
        if (!kind) {
          skipped.push({ label: `Furnish ${room.name}`, reason: `ArchCanvas does not know what kind of room "${room.name}" is. Rename it (for example Bedroom 2 or Kitchen) and ask again.` })
          break
        }
        operations.push({ op: 'furnish_room', room: room.id, kind, label: `Furnish ${room.name} as a ${kind}` })
        break
      }
      case 'remove_furniture':
        operations.push({ op: 'remove_furniture', room: room.id, ...(op.type ? { type: op.type } : {}), label: `Remove ${op.type ? FURNITURE[op.type] : 'furniture'} from ${room.name}` })
        break
      case 'add_door':
      case 'add_window': {
        const opening = kind === 'add_door' ? 'door' : 'window'
        operations.push({ op: 'add_opening', room: room.id, kind: opening, side: op.side, label: `Add a ${opening} on the ${op.side} wall of ${room.name}` })
        break
      }
    }
  }
  return { operations, skipped }
}
