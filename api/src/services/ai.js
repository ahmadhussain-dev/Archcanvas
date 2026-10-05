// The AI behind "Ask ArchCanvas".
//
// Any OpenAI-compatible chat API works. The default is Google's free Gemini
// tier through its OpenAI-compatible endpoint: get a key at
// https://aistudio.google.com/apikey and put it in api/.env as AI_API_KEY.
// AI_PROVIDER=mock answers without any key (for demos and tests).
import { HttpError } from '../lib/httpError.js'
import { minSizeFor } from '../lib/aiPlan.js'

export const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
export const DEFAULT_MODEL = 'gemini-3.8-flash'

// The provider's own error text. Gemini wraps it as [{ error: { message } }].
function providerMessage(text) {
  try {
    const data = JSON.parse(text)
    return String((Array.isArray(data) ? data[0] : data)?.error?.message ?? '')
  } catch {
    return ''
  }
}

// Google's 429 says which free quota ran out (its details name a quota id
// such as GenerateRequestsPerDayPerProjectPerModel-FreeTier) and when to retry.
function limitError(detail, model) {
  if (/PerDay/i.test(detail)) {
    return new HttpError(429, `The free daily AI limit for ${model} is used up. It resets at midnight Pacific time (around noon in Pakistan). Add backup models as AI_FALLBACK_MODELS in api/.env, or try again after the reset.`)
  }
  const seconds = Math.ceil(Number(detail.match(/retry in ([\d.]+)\s*s/i)?.[1] ?? detail.match(/"retryDelay":\s*"(\d+)s"/)?.[1]))
  const wait = seconds > 0 ? `${seconds} seconds` : 'a minute'
  return new HttpError(429, `The free per-minute AI limit was reached. Wait ${wait} and try again.`)
}

// A failed AI call as an error that says what to fix. `detail` is the raw error body.
export function aiError(status, message, model, detail = message) {
  if (status === 429) return limitError(detail, model)
  if (status === 401 || status === 403 || /api key/i.test(message)) {
    return new HttpError(502, 'The AI key was refused. Check AI_API_KEY in api/.env (a Gemini key starts with AIza) and restart the API.')
  }
  // Checked before the model rule: Gemini's "This model is currently experiencing high demand" is a 503.
  if (status >= 500) {
    return new HttpError(503, 'The AI is busy right now (Google reports high demand). Wait a minute and try again.')
  }
  if (status === 404 || /not found|no longer available|not supported/i.test(message)) {
    // Google retires models for new keys and names the replacement, e.g. "use models/gemini-3.8-flash".
    const suggested = message.match(/use (?:models\/)?([\w.-]+)/i)?.[1] ?? DEFAULT_MODEL
    const fix = suggested && suggested !== model
      ? `Set AI_MODEL=${suggested} in api/.env`
      : 'Set AI_MODEL in api/.env to a model listed in Google AI Studio'
    return new HttpError(502, `The AI model "${model}" is not available. ${fix} and restart the API.`)
  }
  return new HttpError(502, `The AI service did not answer properly${message ? ` (${message.slice(0, 200)})` : ''}. Try again.`)
}

// Busy or failing servers (5xx) usually recover within seconds, so those
// are retried once, then each fallback model is tried in turn. A used-up
// limit (429) is per model, so it goes straight to the next model. Retries
// count against the free per-minute limit, which is why there is only one.
const RETRY_DELAYS_MS = [2000]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function openAiCompatibleProvider({
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  model = DEFAULT_MODEL,
  fallbackModels = [],
  timeoutMs = 60_000,
  retryDelaysMs = RETRY_DELAYS_MS
}) {
  const url = new URL('chat/completions', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)

  async function call(messages, modelName) {
    let res
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelName, messages, temperature: 0.3, response_format: { type: 'json_object' } }),
        signal: AbortSignal.timeout(timeoutMs)
      })
    } catch (err) {
      if (err.name === 'TimeoutError') throw new HttpError(504, 'The AI took too long to answer. Try a smaller request.')
      throw new HttpError(502, 'The AI service could not be reached. Check the internet connection and try again.')
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`AI request failed (${res.status}, ${modelName}): ${detail.slice(0, 500)}`)
      const error = aiError(res.status, providerMessage(detail), modelName, detail)
      error.retryable = res.status >= 500
      error.nextModel = res.status === 429
      throw error
    }
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? ''
  }

  return async function ask(messages) {
    let firstError // the main model's error says the most about the setup
    for (const modelName of [model, ...fallbackModels]) {
      for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
        try {
          return await call(messages, modelName)
        } catch (err) {
          firstError ??= err
          if (err.nextModel) break
          if (!err.retryable) throw err
          if (attempt < retryDelaysMs.length) await sleep(retryDelaysMs[attempt])
        }
      }
    }
    throw firstError
  }
}

// Offline stand-in: adds a bedroom with furniture and a door in the first free
// spot, or paints the first room when asked to paint. Only for demos and tests.
export function mockProvider() {
  return async function ask(messages) {
    const user = messages.at(-1)?.content ?? ''
    const summary = JSON.parse(user.slice(user.indexOf('{'), user.lastIndexOf('\nRequest:')))
    const request = user.slice(user.lastIndexOf('\nRequest:') + 9).toLowerCase()
    const first = summary.rooms.find((room) => room.width)
    if (/paint|colou?r/.test(request) && first) {
      return JSON.stringify({ message: `Painted ${first.name} in a soft blue.`, operations: [{ op: 'paint_walls', room: first.id, color: '#8ba3b5' }] })
    }
    const size = 12 + summary.wallThicknessFt
    const plot = summary.plot ?? { width: 60, depth: 60 }
    const taken = summary.rooms.filter((room) => room.width)
    const free = (x, y) => taken.every((r) => x >= r.x + r.width || r.x >= x + size || y >= r.y + r.depth || r.y >= y + size)
    for (let y = 0; y + size <= plot.depth; y += 1) {
      for (let x = 0; x + size <= plot.width; x += 1) {
        if (!free(x, y)) continue
        const name = `Bedroom ${taken.filter((room) => minSizeFor(room.name)?.kind === 'bedroom').length + 1}`
        return JSON.stringify({
          message: `Added ${name} (12 x 12 ft) with a double bed, wardrobe and a door. This is the demo AI; add AI_API_KEY for real answers.`,
          operations: [
            { op: 'add_room', name, x, y, width: size, depth: size },
            { op: 'add_door', room: name, side: 'bottom' },
            { op: 'add_window', room: name, side: 'top' },
            { op: 'add_furniture', room: name, type: 'bed_double' },
            { op: 'add_furniture', room: name, type: 'wardrobe' }
          ]
        })
      }
    }
    return JSON.stringify({ refused: true, message: 'There is no free 12 x 12 ft space left on this plot for another bedroom.', operations: [] })
  }
}

/** The provider set up in the environment, or null when AI is not configured. */
export function providerFromEnv(env = process.env) {
  if (env.AI_PROVIDER === 'mock') return mockProvider()
  if (!env.AI_API_KEY) return null
  return openAiCompatibleProvider({
    apiKey: env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL || DEFAULT_BASE_URL,
    model: env.AI_MODEL || DEFAULT_MODEL,
    fallbackModels: (env.AI_FALLBACK_MODELS || '').split(',').map((name) => name.trim()).filter(Boolean)
  })
}
