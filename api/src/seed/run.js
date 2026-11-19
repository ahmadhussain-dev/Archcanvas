// Adds automatic prices for every material in all 40 cities.
// Safe to run again: online and admin prices are kept.
// Usage: npm run seed -w @archcanvas/api
import mongoose from 'mongoose'
import env from '../config/env.js'
import { connectDatabase } from '../config/db.js'
import { MaterialRate } from '../models/index.js'
import { ensureCityRates, updateCityPrices } from '../services/rateUpdater.js'
import { CITIES } from '../lib/cities.js'

async function seed() {
  await connectDatabase(env.mongoUri)
  await MaterialRate.syncIndexes()
  const added = await ensureCityRates()
  const city = await updateCityPrices()
  console.log(`Material rates: ${added} added for ${CITIES.length} cities. ${city.message}`)
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
