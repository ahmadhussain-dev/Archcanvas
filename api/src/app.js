import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import env from './config/env.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errors.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.clientOrigin, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
