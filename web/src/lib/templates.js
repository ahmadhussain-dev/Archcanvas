import { api } from './api.js'

const OUTDOOR = /terrace|balcony|lawn|garden|porch/i

/** Covered (roofed, indoor) area of a template in square feet, all floors. */
export function coveredArea(template) {
  return template.preview.floors.reduce(
    (sum, floor) => sum + floor.rooms.filter((r) => !OUTDOOR.test(r.name)).reduce((s, r) => s + r.width * r.depth, 0),
    0
  )
}

/** Where to go to start a project from a template: the editor, or sign-up first. */
export async function startFromTemplate(key, loggedIn) {
  if (!loggedIn) return `/register?next=${encodeURIComponent(`/templates/${key}?start=1`)}`
  const { project } = await api.post('/projects/from-template', { template: key })
  return `/projects/${project.id}/editor`
}
