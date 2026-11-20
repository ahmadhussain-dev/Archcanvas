import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { MaterialRate, RegionAdjustment } from '../models/index.js'
import { CITIES, NATIONAL, findCity } from '../lib/cities.js'
import { ADJUSTMENT_LIMITS, REGION_KEYS, adjustmentFor } from '../lib/cityAdjustments.js'
import { applyEstimate, checkRates, latestCheck } from '../services/rateUpdater.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { notFoundError } from '../lib/httpError.js'
import { estimateFor, regionAdjustments, savedAdjustments, DEFAULT_CITY } from '../services/estimate.js'
import { PLOT_PRESETS } from '../lib/units.js'

// "lahore" and "Lahore" are the same city.
const cityName = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .default(DEFAULT_CITY)
  .transform((city) => findCity(city)?.name ?? city)

const estimateSchema = z.object({
  widthFt: z.number().min(5).max(500),
  depthFt: z.number().min(5).max(500),
  floors: z.number().int().min(1).max(5).default(1),
  roofHeightFt: z.number().min(7).max(20).default(10.5),
  city: cityName
})

const rateUpdateSchema = z
  .object({
    ratePkr: z.number().min(0).max(10_000_000).optional(),
    name: z.string().trim().min(1).max(60).optional(),
    unit: z.string().trim().min(1).max(30).optional(),
    verified: z.boolean().optional(),
    // Drop an admin price and go back to the automatic one.
    automatic: z.literal(true).optional()
  })
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update')

// A region's percentage on the national rates, or { reset: true } for the default.
const adjustmentSchema = z.union([
  z.object({ pct: z.number().int().min(ADJUSTMENT_LIMITS.min).max(ADJUSTMENT_LIMITS.max) }),
  z.object({ reset: z.literal(true) })
])

// Public: plot presets, current rates and a quick estimate (used on the landing page and plot setup).
export const publicRates = Router()

publicRates.get('/plots/presets', (req, res) => {
  res.json({ presets: PLOT_PRESETS })
})

// The 40 cities with their region's percentage, for the city pickers.
publicRates.get('/rates/cities', async (req, res) => {
  const saved = await savedAdjustments()
  res.json({
    cities: CITIES.map(({ name, province }) => {
      const { region, pct } = adjustmentFor(name, saved)
      return { name, province, region, adjustmentPct: pct }
    })
  })
})

// The regions, their percentage on the national rates and their cities.
publicRates.get('/rates/regions', async (req, res) => {
  res.json({ regions: await regionAdjustments() })
})

// The national rates every estimate starts from.
publicRates.get('/rates', async (req, res) => {
  const rates = await MaterialRate.find({ city: NATIONAL }).select('-history').sort({ key: 1 })
  res.json({ city: NATIONAL, rates })
})

publicRates.post('/estimate', validate(estimateSchema), async (req, res) => {
  res.json({ estimate: await estimateFor(req.body) })
})

// Admin: optional overrides on /admin/prices. Prices are automatic without them.
export const adminRates = Router()
adminRates.use(requireAuth, requireRole('admin'))

adminRates.get('/rates', async (req, res) => {
  const rates = await MaterialRate.find({ city: NATIONAL }).sort({ key: 1 })
  res.json({ city: NATIONAL, rates })
})

// Change a region's percentage, or put it back to the default.
adminRates.patch('/rates/regions/:region', validate(adjustmentSchema), async (req, res) => {
  const { region } = req.params
  if (!REGION_KEYS.includes(region)) throw notFoundError('Region not found')
  if (req.body.reset) await RegionAdjustment.deleteOne({ region })
  else await RegionAdjustment.findOneAndUpdate({ region }, { pct: req.body.pct, updatedBy: req.auth.userId }, { upsert: true, runValidators: true })
  res.json({ regions: await regionAdjustments() })
})

// The online price check: the latest run, and "Check now".
adminRates.get('/rates/check', async (req, res) => {
  res.json({ check: await latestCheck() })
})

adminRates.post('/rates/check', async (req, res) => {
  res.json({ check: await checkRates({ trigger: 'admin', fetchPage: req.app.locals.fetchPage }) })
})

adminRates.patch('/rates/:id', validate(rateUpdateSchema), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw notFoundError('Rate not found')
  const rate = await MaterialRate.findById(req.params.id)
  if (!rate) throw notFoundError('Rate not found')
  const { ratePkr, name, unit, verified, automatic } = req.body
  const by = req.auth.userId

  if (automatic) {
    // The next daily check puts an online price back on cement and steel.
    const sibling = await MaterialRate.findOne({ city: NATIONAL, 'source.origin': 'estimate', 'source.market': { $gt: 0 } })
    applyEstimate(rate, new Date(), sibling?.source.market ?? 1)
    await rate.save()
    return res.json({ rate })
  }

  if (ratePkr !== undefined) {
    if (ratePkr !== rate.ratePkr) {
      rate.ratePkr = ratePkr
      rate.history.push({ ratePkr, at: new Date(), by, origin: 'admin' })
      if (rate.history.length > 50) rate.history.splice(0, rate.history.length - 50)
    }
    // Saving a price, even the same one, makes it an admin override.
    rate.source = { origin: 'admin' }
    rate.pending = undefined
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
