import { Router } from 'express'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, HttpError } from '../lib/httpError.js'
import { summarizePlan } from '../lib/planSummary.js'
import { buildMessages, parseReply, checkOperations } from '../lib/aiPlan.js'
import { providerFromEnv } from '../services/ai.js'
import { ownProject } from './projects.js'

const askSchema = z.object({
  prompt: z.string().trim().min(3, 'Tell ArchCanvas what to change').max(1000),
  // The plan as it is in the editor now (engine building file), saved or not.
  floorplan: z.union([z.string().max(1_500_000), z.record(z.string(), z.unknown())])
})

// POST /api/projects/:id/ai  { prompt, floorplan }
//   -> { message, refused, operations, skipped }
// Nothing is saved here: the editor previews the operations, and the person
// applies (saved as an 'ai' version) or rejects them.
// options.aiProvider: (messages) => Promise<string>, for tests.
export default function aiRoutes({ rateLimited = true, aiProvider } = {}) {
  const router = Router()
  const limiter = rateLimited
    ? rateLimit({ windowMs: 10 * 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
        message: { error: 'Too many AI requests. Wait a few minutes and try again.' } })
    : (req, res, next) => next()

  router.post('/:id/ai', requireAuth, limiter, validate(askSchema), async (req, res) => {
    const project = await ownProject(req)
    const ask = aiProvider ?? providerFromEnv()
    if (!ask) throw new HttpError(503, 'Ask ArchCanvas is not set up yet. Add a free Gemini key as AI_API_KEY in api/.env and restart the API.')

    let summary
    try {
      summary = summarizePlan(req.body.floorplan)
    } catch {
      throw badRequest('The plan could not be read')
    }

    const text = await ask(buildMessages({ summary, prompt: req.body.prompt, project }))
    let reply
    try {
      reply = parseReply(text)
    } catch (err) {
      console.error('AI answer could not be read:', err.message, String(text).slice(0, 500))
      throw new HttpError(502, 'The AI answer could not be understood. Try asking again, a bit more simply.')
    }

    const { operations, skipped } = reply.refused
      ? { operations: [], skipped: [] }
      : checkOperations(req.body.floorplan, reply.operations)
    res.json({
      message: reply.message || (operations.length ? 'Here is what I would change.' : 'I could not make that change.'),
      refused: reply.refused || operations.length === 0,
      operations,
      skipped
    })
  })

  return router
}
