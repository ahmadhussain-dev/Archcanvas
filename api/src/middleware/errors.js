import { isProduction } from '../config/env.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' })
}

// Express 5 passes errors from async handlers here too.
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    error: status >= 500 && isProduction ? 'Something went wrong' : err.message
  })
}
