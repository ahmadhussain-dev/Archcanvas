import { Router } from 'express'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'
import { User } from '../models/index.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { unauthorized } from '../lib/httpError.js'
import { registerUser, loginUser } from '../services/auth.js'
import {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie
} from '../services/tokens.js'

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address').max(254))

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number')
})

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(200)
})

// Sends the access token in the body and the refresh token as an httpOnly cookie.
function sendSession(res, status, user, tokenVersion) {
  setRefreshCookie(res, signRefreshToken(user, tokenVersion))
  res.status(status).json({ user, accessToken: signAccessToken(user) })
}

export default function authRoutes({ rateLimited = true } = {}) {
  const router = Router()
  const limiter = rateLimited
    ? rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
        message: { error: 'Too many requests, please try again later' } })
    : (req, res, next) => next()

  router.post('/register', limiter, validate(registerSchema), async (req, res) => {
    const user = await registerUser(req.body)
    sendSession(res, 201, user, 0)
  })

  router.post('/login', limiter, validate(loginSchema), async (req, res) => {
    try {
      const user = await loginUser(req.body)
      sendSession(res, 200, user, user.tokenVersion)
    } catch (err) {
      if (err.retryAfterSeconds) res.set('Retry-After', String(err.retryAfterSeconds))
      throw err
    }
  })

  // Swaps a valid refresh cookie for a new access token, and rotates the cookie.
  router.post('/refresh', async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) throw unauthorized()
    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      clearRefreshCookie(res)
      throw unauthorized('Your session has expired, please log in again')
    }
    const user = await User.findById(payload.sub).select('+tokenVersion')
    if (!user || user.tokenVersion !== payload.tv) {
      clearRefreshCookie(res)
      throw unauthorized('Your session has expired, please log in again')
    }
    sendSession(res, 200, user, user.tokenVersion)
  })

  // Ends the session on every device by invalidating all refresh tokens.
  router.post('/logout', async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (token) {
      try {
        const payload = verifyRefreshToken(token)
        await User.updateOne({ _id: payload.sub, tokenVersion: payload.tv }, { $inc: { tokenVersion: 1 } })
      } catch {
        // An expired or forged cookie has nothing to revoke.
      }
    }
    clearRefreshCookie(res)
    res.status(204).end()
  })

  router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(req.auth.userId)
    if (!user) throw unauthorized()
    res.json({ user })
  })

  return router
}
