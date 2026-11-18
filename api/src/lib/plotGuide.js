// What usually works on a plot of a given size in Pakistan: the rooms of a
// good floor plan for each floor, and the ideas offered in the Ask panel.
// The AI gets the same plan as a starting point when someone asks for "the
// best plan for this plot", so its suggestions match the plot size.
import { sqftToMarla } from './units.js'

// One bedroom with its attached bath needs about this much width (feet).
const BEDROOM_SUITE_FT = 16.5

function plotLabel(widthFt, depthFt) {
  const marla = sqftToMarla(widthFt * depthFt)
  if (marla >= 19.5) {
    const kanal = Math.round((marla / 20) * 2) / 2
    return `${kanal} Kanal`
  }
  return `${Math.round(marla * 2) / 2} Marla`
}

// The narrowest kitchen worth having (centre lines).
const KITCHEN_FT = 8
// Room left across the back for a kitchen beside a single bedroom suite: a
// 25 or 30 ft plot puts its kitchen at the back next to the master bedroom
// instead of making that bedroom 20 ft wide.
const kitchenAtBack = (widthFt, suites) => suites === 1 && widthFt - BEDROOM_SUITE_FT >= KITCHEN_FT

// Bedrooms with attached baths that fit side by side across the plot.
const suitesAcross = (widthFt, max) => Math.max(1, Math.min(max, Math.floor(widthFt / BEDROOM_SUITE_FT)))

function bedrooms(count, zone, first = 'Master Bedroom') {
  const rooms = []
  for (let i = 0; i < count; i += 1) {
    const start = Number(first.match(/\d+/)?.[0] ?? 1)
    const name = i === 0 ? first : `Bedroom ${start + i}`
    rooms.push({ name, zone, ...(i === 0 && first === 'Master Bedroom' ? { size: 'large' } : {}) })
    rooms.push({ name: name === 'Master Bedroom' ? 'Master Bath' : name.replace('Bedroom', 'Bath'), attached_to: name })
  }
  return rooms
}

/**
 * A good floor for this plot: rooms for layout_floor, and a one-line summary.
 * @param {{widthFt:number, depthFt:number}} plot
 * @param {{upstairs?:boolean}} options
 */
export function suggestedFloor({ widthFt, depthFt }, { upstairs = false } = {}) {
  const marla = sqftToMarla(widthFt * depthFt)
  let rooms
  let why
  if (upstairs) {
    if (marla < 4) {
      rooms = [{ name: 'Bedroom 2', zone: 'back' }, { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Common Bath', zone: 'front' }, { name: 'Terrace', zone: 'front' }]
      why = 'a bedroom at the back, a family lounge beside the stairs, and a bath and an open terrace at the front'
    } else {
      const back = suitesAcross(widthFt, 2)
      const kitchenZone = kitchenAtBack(widthFt, back) ? 'back' : 'middle'
      rooms = [...bedrooms(back, 'back', 'Bedroom 1'), { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: kitchenZone, size: 'small' }]
      // A kanal upstairs has the width for a dining area by the lounge and a fourth suite at the front.
      const big = marla >= 18 && widthFt >= BEDROOM_SUITE_FT * 2 + KITCHEN_FT
      if (big) rooms.push({ name: 'Dining', zone: 'middle' })
      const front = marla >= 7 ? (big ? 2 : 1) : 0
      if (front) rooms.push(...bedrooms(front, 'front', `Bedroom ${back + 1}`))
      rooms.push({ name: 'Terrace', zone: 'front' })
      why = `${back + front} bedrooms with attached baths, a family lounge${big ? ' with a dining area' : ''}, a small kitchen and a front terrace`
    }
    return { label: plotLabel(widthFt, depthFt), rooms, why }
  }
  if (marla < 4) {
    // A small plot has no room for a porch: the main door opens into a
    // full-width lounge at the front, the bedroom and stairs open off it, and
    // the kitchen and bath sit at the back (the kitchen reached past the stairs).
    rooms = [{ name: 'Kitchen', zone: 'back', size: 'small' }, { name: 'Master Bath', zone: 'back' }, { name: 'Master Bedroom', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'TV Lounge', zone: 'front' }]
    why = 'a full-width lounge at the front with the main door, the bedroom and the stairs opening off it, and the kitchen and the bedroom\'s bath at the back'
  } else if (marla < 9) {
    const back = suitesAcross(widthFt, 2)
    if (kitchenAtBack(widthFt, back)) {
      // The kitchen at the back beside the master suite; a dining area next to the lounge when the plot is wide enough.
      const dining = widthFt >= 28 ? [{ name: 'Dining', zone: 'middle' }] : []
      rooms = [...bedrooms(1, 'back'), { name: 'Kitchen', zone: 'back' }, { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, ...dining, { name: 'Car Porch', zone: 'front' }, { name: 'Drawing Room', zone: 'front' }]
      why = `a master bedroom with attached bath and the kitchen at the back, a family lounge${dining.length ? ' with a dining area' : ''} and the stairs in the middle, and a car porch and drawing room for guests at the front`
    } else {
      rooms = [...bedrooms(back, 'back'), { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: 'middle' }, { name: 'Car Porch', zone: 'front' }, { name: 'Drawing Room', zone: 'front' }]
      why = `${back === 1 ? 'a master bedroom' : `${back} bedrooms`} with attached bath${back === 1 ? '' : 's'} at the back for privacy, the lounge and kitchen in the middle, and a car porch and drawing room for guests at the front`
    }
  } else if (marla < 18) {
    const back = suitesAcross(widthFt, 2)
    rooms = [...bedrooms(back, 'back'), { name: 'TV Lounge', zone: 'middle' }, { name: 'Dining', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: 'middle' }, { name: 'Car Porch', zone: 'front' }, { name: 'Drawing Room', zone: 'front' }, { name: 'Guest Bath', zone: 'front' }]
    why = `${back} bedroom suites at the back, lounge with a separate dining area and kitchen in the middle, and a car porch, drawing room and guest bath at the front`
  } else {
    const back = suitesAcross(widthFt, 2)
    rooms = [...bedrooms(back, 'back'), { name: 'TV Lounge', zone: 'middle', size: 'large' }, { name: 'Dining', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: 'middle' }, { name: 'Store', zone: 'middle' }, { name: 'Car Porch', zone: 'front', size: 'large' }, { name: 'Drawing Room', zone: 'front', size: 'large' }, ...bedrooms(1, 'front', 'Guest Bedroom')]
    why = `${back} bedroom suites at the back, a large lounge with dining, kitchen and store in the middle, and a two-car porch, a drawing room and a guest bedroom suite at the front, with a back lawn`
  }
  return { label: plotLabel(widthFt, depthFt), rooms, why }
}

const roomList = (rooms) => {
  const names = rooms.filter((room) => !room.attached_to).map((room) => {
    const bath = rooms.find((other) => other.attached_to === room.name)
    return bath ? `${room.name} with attached bath` : room.name
  })
  return names.join(', ')
}

const simple = (text) => String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * The plan for a suggested prompt, without asking the AI: "Suggest the best
 * layout for this plot" (as offered in the Ask panel, or said in other
 * words) and the offered "Design this floor: ..." give the proper plan for
 * this plot size every time, follow the plot guide exactly, and work even
 * when the free AI quota has run out. Anything else returns null and goes to
 * the AI.
 * @returns {{ rooms: object[], message: string } | null}
 */
export function suggestedReply(project, prompt, { upstairs = false } = {}) {
  const { widthFt, depthFt } = project.plot ?? {}
  if (!(widthFt > 0) || !(depthFt > 0)) return null
  const asked = simple(prompt)
  const offered = promptIdeas(project, { upstairs }).ideas.filter((idea) => idea.kind !== 'change').map((idea) => simple(idea.text))
  const best = /\b(best|ideal|recommended|suggested|standard|proper|good)\b/.test(asked) &&
    /\b(layout|plan|floor ?plan|design|house|map|naksha)\b/.test(asked) &&
    asked.split(' ').length <= 16 &&
    // A request with its own rooms in it ("best layout with 4 bedrooms") is for the AI.
    !/\d+\s*(bed|room|bath)|bedroom|kitchen|bath|lounge|porch|drawing|dining|stair|terrace|store|without|no /.test(asked)
  if (!offered.includes(asked) && !best) return null
  const plan = suggestedFloor({ widthFt, depthFt }, { upstairs })
  return {
    rooms: plan.rooms,
    message: `For this ${plan.label} plot I suggest ${plan.why}. Every room comes with its doors, windows and full set of fittings and furniture.`
  }
}

/** Ideas for the Ask panel that suit this plot and floor. */
export function promptIdeas(project, { upstairs = false } = {}) {
  const { widthFt, depthFt } = project.plot
  const plan = suggestedFloor({ widthFt, depthFt }, { upstairs })
  const size = `${plan.label} (${widthFt} x ${depthFt} ft)`
  const ideas = [
    { kind: 'best', text: `Suggest the best layout for this ${size} plot` },
    { kind: 'design', text: `Design this floor: ${roomList(plan.rooms)}` }
  ]
  const marla = sqftToMarla(widthFt * depthFt)
  if (upstairs) ideas.push({ kind: 'change', text: 'Add a front terrace over the car porch' })
  else if (marla < 4) ideas.push({ kind: 'change', text: 'Make the lounge bigger and the kitchen compact' })
  else ideas.push({ kind: 'change', text: 'Add a guest bath near the drawing room' })
  ideas.push({ kind: 'change', text: 'Furnish every room with proper furniture' })
  ideas.push({ kind: 'change', text: 'Put white marble tiles in the lounge and drawing room' })
  return { label: plan.label, size, why: plan.why, ideas }
}
