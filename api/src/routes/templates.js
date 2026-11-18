import { Router } from 'express'
import { listTemplates, getTemplate } from '../lib/templates.js'
import { notFoundError } from '../lib/httpError.js'

// Public: the ready-made houses shown on the landing page and dashboard.
const router = Router()

router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600')
  res.json({ templates: listTemplates() })
})

router.get('/:key', (req, res) => {
  const template = getTemplate(req.params.key)
  if (!template) throw notFoundError('Template not found')
  const { building, ...card } = template
  res.set('Cache-Control', 'public, max-age=3600')
  res.json({ template: card })
})

export default router
