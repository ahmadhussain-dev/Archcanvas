import jwt from 'jsonwebtoken'
import env, { isProduction } from '../config/env.js'

export const ACCESS_TTL = '15m'
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const REFRESH_COOKIE = 'ac_refresh'

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: ACCESS_TTL,
    algorithm: 'HS256'
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] })
}

export function signRefreshToken(user, tokenVersion) {
  return jwt.sign({ sub: user.id, tv: tokenVersion }, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TTL_MS / 1000,
    algorithm: 'HS256'
  })
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret, { algorithms: ['HS256'] })
}

// The refresh token lives in an httpOnly cookie that only the auth routes receive.
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/api/auth'
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions, maxAge: REFRESH_TTL_MS })
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions)
}
