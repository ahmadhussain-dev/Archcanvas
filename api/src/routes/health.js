import { Router } from 'express'
import { databaseState } from '../config/db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ status: 'ok', database: databaseState() })
})

export default router
