// Adds the default material rates. Safe to run again: existing rates are left as they are.
// Usage: npm run seed -w @archcanvas/api
import mongoose from 'mongoose'
import env from '../config/env.js'
import { connectDatabase } from '../config/db.js'
import { MaterialRate } from '../models/index.js'
import { DEFAULT_RATES } from './materialRates.js'

async function seed() {
  await connectDatabase(env.mongoUri)
  await MaterialRate.syncIndexes()
  let added = 0
  for (const rate of DEFAULT_RATES) {
    const res = await MaterialRate.updateOne(
      { key: rate.key, city: 'Faisalabad' },
      { $setOnInsert: { ...rate, city: 'Faisalabad', status: 'unverified' } },
      { upsert: true }
    )
    added += res.upsertedCount
  }
  console.log(`Material rates: ${added} added, ${DEFAULT_RATES.length - added} already there.`)
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
