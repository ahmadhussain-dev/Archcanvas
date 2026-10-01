import { verifyAccessToken } from '../services/tokens.js'
import { unauthorized, forbidden } from '../lib/httpError.js'

// Reads "Authorization: Bearer <access token>" and sets req.auth = { userId, role }.
export function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return next(unauthorized())
  try {
    const payload = verifyAccessToken(token)
    req.auth = { userId: payload.sub, role: payload.role }
    next()
  } catch {
    next(unauthorized('Your session has expired, please log in again'))
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) return next(unauthorized())
    if (!roles.includes(req.auth.role)) return next(forbidden())
    next()
  }
}
