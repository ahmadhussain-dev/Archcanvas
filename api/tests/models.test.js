import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { User, Project, ProjectVersion, MaterialRate } from '../src/models/index.js'
import { DEFAULT_RATES } from '../src/seed/materialRates.js'
import { PLOT_PRESETS, SQFT_PER_MARLA } from '../src/lib/units.js'

// These tests check schema rules with validate(); no database is needed.
const id = () => new mongoose.Types.ObjectId()

test('a valid user passes and its JSON never exposes secrets', async () => {
  const user = new User({ name: 'Ahmad', email: ' Ahmad@Example.COM ', passwordHash: 'hash', failedLoginCount: 2 })
  await user.validate()
  assert.equal(user.email, 'ahmad@example.com')
  assert.equal(user.role, 'user')
  const json = user.toJSON()
  assert.equal(json.passwordHash, undefined)
  assert.equal(json.failedLoginCount, undefined)
  assert.equal(json.lockUntil, undefined)
  assert.ok(json.id)
})

test('user email and role are checked', async () => {
  await assert.rejects(new User({ name: 'A', email: 'not-an-email', passwordHash: 'h' }).validate(), /valid email/)
  await assert.rejects(new User({ name: 'A', email: 'a@b.co', passwordHash: 'h', role: 'owner' }).validate())
})

test('a user is locked only while lockUntil is in the future', () => {
  assert.equal(new User({ lockUntil: new Date(Date.now() + 60_000) }).isLocked, true)
  assert.equal(new User({ lockUntil: new Date(Date.now() - 60_000) }).isLocked, false)
  assert.equal(new User({}).isLocked, false)
})

test('a 5 Marla project works out its plot area', async () => {
  const project = new Project({ owner: id(), name: 'My 5 Marla house', plot: { preset: '5-marla', widthFt: 25, depthFt: 45 } })
  await project.validate()
  assert.equal(project.plot.areaSqft, 1125)
  assert.equal(project.plot.areaMarla, 5)
  assert.equal(project.floors, 1)
  assert.equal(project.city, 'Faisalabad')
  assert.equal(project.toJSON().plot.areaMarla, 5)
})

test('project plot sizes and floors stay in range', async () => {
  await assert.rejects(new Project({ owner: id(), name: 'x', plot: { widthFt: 2, depthFt: 45 } }).validate())
  await assert.rejects(new Project({ owner: id(), name: 'x', plot: { widthFt: 25, depthFt: 45 }, floors: 9 }).validate())
  await assert.rejects(new Project({ owner: id(), name: 'x' }).validate())
})

test('a project version stores the engine floorplan and its source', async () => {
  const v = new ProjectVersion({ project: id(), number: 1, floorplan: { floors: [] }, createdBy: id(), source: 'ai' })
  await v.validate()
  await assert.rejects(new ProjectVersion({ project: id(), number: 1, floorplan: {}, createdBy: id(), source: 'magic' }).validate())
  await assert.rejects(new ProjectVersion({ project: id(), number: 0, floorplan: {}, createdBy: id() }).validate())
})

test('material rate status: unverified, verified, then stale after 30 days', () => {
  const base = { key: 'cement', name: 'Cement', unit: 'bag', ratePkr: 1450 }
  assert.equal(new MaterialRate(base).displayStatus, 'unverified')
  assert.equal(new MaterialRate({ ...base, status: 'verified', verifiedAt: new Date() }).displayStatus, 'verified')
  const old = new Date(Date.now() - 31 * 86_400_000)
  assert.equal(new MaterialRate({ ...base, status: 'verified', verifiedAt: old }).displayStatus, 'stale')
})

test('material rates reject unknown materials and negative prices', async () => {
  await assert.rejects(new MaterialRate({ key: 'gold', name: 'Gold', unit: 'g', ratePkr: 1 }).validate())
  await assert.rejects(new MaterialRate({ key: 'sand', name: 'Sand', unit: 'cft', ratePkr: -5 }).validate())
})

test('every default rate is valid and each material appears once', async () => {
  const keys = new Set()
  for (const rate of DEFAULT_RATES) {
    await new MaterialRate(rate).validate()
    keys.add(rate.key)
  }
  assert.equal(keys.size, DEFAULT_RATES.length)
})

test('plot presets match the 225 sq ft Marla', () => {
  for (const p of PLOT_PRESETS) {
    assert.equal(p.widthFt * p.depthFt, p.marla * SQFT_PER_MARLA, p.label)
  }
})
