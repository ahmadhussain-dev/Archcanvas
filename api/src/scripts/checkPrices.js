// Runs the online price check once and prints what happened.
// Usage: npm run check-prices -w @archcanvas/api
import mongoose from 'mongoose'
import env from '../config/env.js'
import { connectDatabase } from '../config/db.js'
import { checkRates } from '../services/rateUpdater.js'

async function run() {
  await connectDatabase(env.mongoUri)
  const check = await checkRates({ trigger: 'script' })
  for (const r of check.results) console.log(`${r.key}: ${r.ok ? 'ok' : 'FAILED'}. ${r.message}${r.held.length ? ` Held: ${r.held.join(', ')}.` : ''}`)
  if (!check.results.every((r) => r.ok)) process.exitCode = 1
}

run()
  .catch((err) => {
    console.error('Price check failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
