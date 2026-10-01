import { badRequest } from '../lib/httpError.js'

// Checks req[part] against a zod schema and replaces it with the parsed value.
// Express 5 makes req.query read-only, so parsed queries go on req.validQuery.
export function validate(schema, part = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[part] ?? {})
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      return next(badRequest(details[0]?.message ?? 'Invalid request', details))
    }
    if (part === 'query') req.validQuery = result.data
    else req[part] = result.data
    next()
  }
}
