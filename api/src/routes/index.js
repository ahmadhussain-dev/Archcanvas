import { Router } from 'express'
import health from './health.js'

const router = Router()

router.use('/health', health)
// Next: /auth, /projects, /rates, /admin (step 3)

export default router
