// Talks to the ArchCanvas API. In development Vite forwards /api to localhost:4000.
// The access token lives only in memory; the refresh token is an httpOnly cookie.
const BASE = import.meta.env.VITE_API_URL ?? '/api'

let accessToken = null
let refreshing = null
let onSessionEnd = () => {}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details ?? []
  }

  // Field errors from the API, as { email: 'Enter a valid email address' }.
  get fieldErrors() {
    return Object.fromEntries(this.details.filter((d) => d.field).map((d) => [d.field, d.message]))
  }
}

export function setAccessToken(token) {
  accessToken = token
}

export function onSessionEnded(callback) {
  onSessionEnd = callback
}

async function send(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new ApiError(0, "Can't reach ArchCanvas. Check your internet connection and try again.")
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Something went wrong', data.details)
  return data
}

// Gets a new access token from the refresh cookie. Parallel callers share one request.
export function refreshSession() {
  refreshing ??= send('/auth/refresh', { method: 'POST', auth: false })
    .then((data) => {
      accessToken = data.accessToken
      return data.user
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// Calls the API; if the access token has expired, refreshes once and retries.
export async function api(path, options = {}) {
  try {
    return await send(path, options)
  } catch (err) {
    if (err.status !== 401 || options.auth === false || !accessToken) throw err
    try {
      await refreshSession()
    } catch {
      accessToken = null
      onSessionEnd()
      throw err
    }
    return send(path, options)
  }
}

api.get = (path) => api(path)
api.post = (path, body) => api(path, { method: 'POST', body })
api.patch = (path, body) => api(path, { method: 'PATCH', body })
api.delete = (path) => api(path, { method: 'DELETE' })
