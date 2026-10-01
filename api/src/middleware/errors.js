import { isProduction } from '../config/env.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' })
}

// Maps database errors to the right status code.
function normalise(err) {
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    return { status: 400, message: details[0]?.message ?? 'Invalid data', details }
  }
  if (err.name === 'CastError') return { status: 400, message: `Invalid ${err.path}` }
  if (err.code === 11000) return { status: 409, message: 'That already exists' }
  return { status: err.status ?? err.statusCode ?? 500, message: err.message, details: err.details }
}

// Express 5 passes errors from async handlers here too.
export function errorHandler(err, req, res, next) {
  const { status, message, details } = normalise(err)
  if (status >= 500) console.error(err)
  const body = { error: status >= 500 && isProduction ? 'Something went wrong' : message }
  if (details && status < 500) body.details = details
  res.status(status).json(body)
}
