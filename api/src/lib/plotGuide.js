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
      rooms = [...bedrooms(back, 'back', 'Bedroom 1'), { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: 'middle', size: 'small' }]
      if (marla >= 7) rooms.push(...bedrooms(1, 'front', `Bedroom ${back + 1}`))
      rooms.push({ name: 'Terrace', zone: 'front' })
      why = `${back + (marla >= 7 ? 1 : 0)} bedrooms with attached baths, a family lounge, a small kitchen and a front terrace`
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
    rooms = [...bedrooms(back, 'back'), { name: 'TV Lounge', zone: 'middle' }, { name: 'Staircase', zone: 'middle' }, { name: 'Kitchen', zone: 'middle' }, { name: 'Car Porch', zone: 'front' }, { name: 'Drawing Room', zone: 'front' }]
    why = `${back === 1 ? 'a master bedroom' : `${back} bedrooms`} with attached bath${back === 1 ? '' : 's'} at the back for privacy, the lounge and kitchen in the middle, and a car porch and drawing room for guests at the front`
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
