import env from './config/env.js'
import { connectDatabase } from './config/db.js'
import { createApp } from './app.js'

async function start() {
  await connectDatabase(env.mongoUri)
  createApp().listen(env.port, () => {
    console.log(`ArchCanvas API on http://localhost:${env.port}`)
  })
}

start().catch((err) => {
  console.error('API failed to start:', err.message)
  process.exit(1)
})
