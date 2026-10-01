import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Project, ProjectVersion } from '../models/index.js'
import { VERSION_SOURCES } from '../models/ProjectVersion.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, notFoundError } from '../lib/httpError.js'
import { estimateFor } from '../services/estimate.js'

const plot = z.object({
  preset: z.string().trim().max(20).default('custom'),
  widthFt: z.number().min(5).max(500),
  depthFt: z.number().min(5).max(500)
})

const requirements = z.object({
  bedrooms: z.number().int().min(0).max(12).optional(),
  bathrooms: z.number().int().min(0).max(12).optional(),
  kitchens: z.number().int().min(0).max(4).optional(),
  carPorch: z.boolean().optional(),
  drawingRoom: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional()
})

const projectFields = {
  name: z.string().trim().min(1, 'Give the project a name').max(100),
  city: z.string().trim().min(1).max(60),
  plot,
  floors: z.number().int().min(1).max(5),
  roofHeightFt: z.number().min(7).max(20),
  requirements: requirements.nullable(),
  thumbnail: z.string().max(300000).startsWith('data:image/').nullable()
}

const createSchema = z.object({
  ...projectFields,
  city: projectFields.city.optional(),
  floors: projectFields.floors.optional(),
  roofHeightFt: projectFields.roofHeightFt.optional(),
  requirements: requirements.optional(),
  thumbnail: projectFields.thumbnail.optional(),
  // Optional starting plan (engine building file JSON).
  floorplan: z.record(z.string(), z.unknown()).optional()
})

const updateSchema = z
  .object(projectFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update')

const versionSchema = z.object({
  floorplan: z.record(z.string(), z.unknown()),
  source: z.enum(VERSION_SOURCES.filter((s) => s !== 'restore')).default('manual'),
  note: z.string().trim().max(200).optional()
})

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
})

// Loads a project that belongs to the logged-in user. Someone else's project is a 404, not a 403.
async function ownProject(req) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) throw notFoundError('Project not found')
  const project = await Project.findOne({ _id: id, owner: req.auth.userId })
  if (!project) throw notFoundError('Project not found')
  return project
}

// Adds a version and points the project at it. The counter is bumped atomically
// so two saves at once cannot get the same number.
async function addVersion(project, { floorplan, source, note }, userId) {
  const bumped = await Project.findByIdAndUpdate(project._id, { $inc: { versionCount: 1 } }, { new: true })
  const version = await ProjectVersion.create({
    project: project._id,
    number: bumped.versionCount,
    source,
    note,
    floorplan,
    createdBy: userId
  })
  await Project.updateOne({ _id: project._id }, { $set: { currentVersion: version._id } })
  return version
}

const router = Router()
router.use(requireAuth)

router.get('/', validate(listQuery, 'query'), async (req, res) => {
  const { page, limit } = req.validQuery
  const filter = { owner: req.auth.userId }
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    Project.countDocuments(filter)
  ])
  res.json({ projects, page, limit, total })
})

router.post('/', validate(createSchema), async (req, res) => {
  const { floorplan, ...fields } = req.body
  const project = await Project.create({ ...fields, owner: req.auth.userId })
  if (floorplan) await addVersion(project, { floorplan, source: 'template' }, req.auth.userId)
  res.status(201).json({ project: await Project.findById(project._id) })
})

router.get('/:id', async (req, res) => {
  const project = await ownProject(req)
  const version = project.currentVersion ? await ProjectVersion.findById(project.currentVersion) : null
  res.json({ project, floorplan: version?.floorplan ?? null, version: version?.number ?? null })
})

router.patch('/:id', validate(updateSchema), async (req, res) => {
  const project = await ownProject(req)
  for (const [key, value] of Object.entries(req.body)) project.set(key, value ?? undefined)
  await project.save()
  res.json({ project })
})

router.delete('/:id', async (req, res) => {
  const project = await ownProject(req)
  await ProjectVersion.deleteMany({ project: project._id })
  await project.deleteOne()
  res.status(204).end()
})

router.get('/:id/versions', async (req, res) => {
  const project = await ownProject(req)
  const versions = await ProjectVersion.find({ project: project._id })
    .select('-floorplan')
    .sort({ number: -1 })
    .limit(100)
  res.json({ versions })
})

router.post('/:id/versions', validate(versionSchema), async (req, res) => {
  const project = await ownProject(req)
  const version = await addVersion(project, req.body, req.auth.userId)
  res.status(201).json({ version: { ...version.toJSON(), floorplan: undefined } })
})

router.get('/:id/versions/:number', async (req, res) => {
  const project = await ownProject(req)
  const number = Number(req.params.number)
  if (!Number.isInteger(number) || number < 1) throw badRequest('Invalid version number')
  const version = await ProjectVersion.findOne({ project: project._id, number })
  if (!version) throw notFoundError('Version not found')
  res.json({ version })
})

// Copies an old version forward as the newest one, so history is never lost.
router.post('/:id/versions/:number/restore', async (req, res) => {
  const project = await ownProject(req)
  const number = Number(req.params.number)
  if (!Number.isInteger(number) || number < 1) throw badRequest('Invalid version number')
  const old = await ProjectVersion.findOne({ project: project._id, number })
  if (!old) throw notFoundError('Version not found')
  const version = await addVersion(
    project,
    { floorplan: old.floorplan, source: 'restore', note: `Restored version ${number}` },
    req.auth.userId
  )
  res.status(201).json({ version: { ...version.toJSON(), floorplan: undefined } })
})

router.get('/:id/estimate', async (req, res) => {
  const project = await ownProject(req)
  const estimate = await estimateFor({
    widthFt: project.plot.widthFt,
    depthFt: project.plot.depthFt,
    floors: project.floors,
    roofHeightFt: project.roofHeightFt,
    city: project.city
  })
  res.json({ estimate })
})

export default router
