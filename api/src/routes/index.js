import { Router } from 'express'
import health from './health.js'
import authRoutes from './auth.js'
import projects from './projects.js'
import aiRoutes from './ai.js'
import { publicRates, adminRates } from './rates.js'

export default function routes(options = {}) {
  const router = Router()
  router.use('/health', health)
  router.use('/auth', authRoutes(options))
  router.use('/projects', aiRoutes(options))
  router.use('/projects', projects)
  router.use('/admin', adminRates)
  router.use('/', publicRates)
  return router
}
