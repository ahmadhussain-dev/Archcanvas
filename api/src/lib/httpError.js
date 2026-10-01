// An error with an HTTP status, turned into a JSON response by middleware/errors.js.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    if (details) this.details = details
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details)
export const unauthorized = (message = 'Please log in') => new HttpError(401, message)
export const forbidden = (message = 'You do not have access to this') => new HttpError(403, message)
export const notFoundError = (message = 'Not found') => new HttpError(404, message)
export const conflict = (message) => new HttpError(409, message)
