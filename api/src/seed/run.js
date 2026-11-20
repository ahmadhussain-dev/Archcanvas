// Adds the automatic national price for every material.
// Safe to run again: online and admin prices are kept.
// Usage: npm run seed -w @archcanvas/api
import mongoose from 'mongoose'
import env from '../config/env.js'
import { connectDatabase } from '../config/db.js'
import { MaterialRate } from '../models/index.js'
import { ensureNationalRates, updateNationalPrices } from '../services/rateUpdater.js'

async function seed() {
  await connectDatabase(env.mongoUri)
  await MaterialRate.syncIndexes()
  const added = await ensureNationalRates()
  const national = await updateNationalPrices()
  console.log(`Material rates: ${added} added. ${national.message}`)
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
