import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { MaterialRate } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { notFoundError } from '../lib/httpError.js'
import { estimateFor, DEFAULT_CITY } from '../services/estimate.js'
import { PLOT_PRESETS } from '../lib/units.js'

const cityQuery = z.object({ city: z.string().trim().min(1).max(60).default(DEFAULT_CITY) })

const estimateSchema = z.object({
  widthFt: z.number().min(5).max(500),
  depthFt: z.number().min(5).max(500),
  floors: z.number().int().min(1).max(5).default(1),
  roofHeightFt: z.number().min(7).max(20).default(10.5),
  city: z.string().trim().min(1).max(60).default(DEFAULT_CITY)
})

const rateUpdateSchema = z
  .object({
    ratePkr: z.number().min(0).max(10_000_000).optional(),
    name: z.string().trim().min(1).max(60).optional(),
    unit: z.string().trim().min(1).max(30).optional(),
    verified: z.boolean().optional()
  })
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update')

// Public: plot presets, current rates and a quick estimate (used on the landing page and plot setup).
export const publicRates = Router()

publicRates.get('/plots/presets', (req, res) => {
  res.json({ presets: PLOT_PRESETS })
})

publicRates.get('/rates', validate(cityQuery, 'query'), async (req, res) => {
  const rates = await MaterialRate.find({ city: req.validQuery.city }).select('-history').sort({ key: 1 })
  res.json({ city: req.validQuery.city, rates })
})

publicRates.post('/estimate', validate(estimateSchema), async (req, res) => {
  res.json({ estimate: await estimateFor(req.body) })
})

// Admin: edit and verify prices on /admin/prices.
export const adminRates = Router()
adminRates.use(requireAuth, requireRole('admin'))

adminRates.get('/rates', validate(cityQuery, 'query'), async (req, res) => {
  const rates = await MaterialRate.find({ city: req.validQuery.city }).sort({ key: 1 })
  res.json({ city: req.validQuery.city, rates })
})

adminRates.patch('/rates/:id', validate(rateUpdateSchema), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw notFoundError('Rate not found')
  const rate = await MaterialRate.findById(req.params.id)
  if (!rate) throw notFoundError('Rate not found')
  const { ratePkr, name, unit, verified } = req.body
  const by = req.auth.userId

  if (ratePkr !== undefined && ratePkr !== rate.ratePkr) {
    rate.ratePkr = ratePkr
    rate.history.push({ ratePkr, at: new Date(), by })
    if (rate.history.length > 50) rate.history.splice(0, rate.history.length - 50)
  }
  if (name !== undefined) rate.name = name
  if (unit !== undefined) rate.unit = unit
  // Saving a price as an admin counts as checking it, unless they say otherwise.
  const markVerified = verified ?? ratePkr !== undefined
  if (markVerified) {
    rate.status = 'verified'
    rate.verifiedAt = new Date()
    rate.verifiedBy = by
  } else if (verified === false) {
    rate.status = 'unverified'
    rate.verifiedAt = undefined
    rate.verifiedBy = undefined
  }
  await rate.save()
  res.json({ rate })
})
