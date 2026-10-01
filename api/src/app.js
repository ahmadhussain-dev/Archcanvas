import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import env from './config/env.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errors.js'

// options.rateLimited: set false in tests so repeated logins are not throttled.
export function createApp(options = {}) {
  const app = express()

  app.disable('x-powered-by')
  // One proxy in front in production (Render/Railway), so rate limits see the real client IP.
  if (env.nodeEnv === 'production') app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: env.clientOrigin, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.use('/api', routes(options))

  app.use(notFound)
  app.use(errorHandler)
  return app
}
