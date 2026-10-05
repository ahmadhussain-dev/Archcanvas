// The AI behind "Ask ArchCanvas".
//
// Any OpenAI-compatible chat API works. The default is Google's free Gemini
// tier through its OpenAI-compatible endpoint: get a key at
// https://aistudio.google.com/apikey and put it in api/.env as AI_API_KEY.
// AI_PROVIDER=mock answers without any key (for demos and tests).
import { HttpError } from '../lib/httpError.js'
import { minSizeFor } from '../lib/aiPlan.js'

export const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
export const DEFAULT_MODEL = 'gemini-2.5-flash'

// The provider's own error text. Gemini wraps it as [{ error: { message } }].
function providerMessage(text) {
  try {
    const data = JSON.parse(text)
    return String((Array.isArray(data) ? data[0] : data)?.error?.message ?? '')
  } catch {
    return ''
  }
}

// A failed AI call as an error that says what to fix.
export function aiError(status, message, model) {
  if (status === 429) return new HttpError(429, 'The free AI limit was reached. Wait a minute and try again.')
  if (status === 401 || status === 403 || /api key/i.test(message)) {
    return new HttpError(502, 'The AI key was refused. Check AI_API_KEY in api/.env (a Gemini key starts with AIza) and restart the API.')
  }
  if (status === 404 || /model/i.test(message)) {
    return new HttpError(502, `The AI model "${model}" was not found. Set AI_MODEL=${DEFAULT_MODEL} in api/.env and restart the API.`)
  }
  return new HttpError(502, `The AI service did not answer properly${message ? ` (${message.slice(0, 200)})` : ''}. Try again.`)
}

export function openAiCompatibleProvider({ apiKey, baseUrl = DEFAULT_BASE_URL, model = DEFAULT_MODEL, timeoutMs = 60_000 }) {
  return async function ask(messages) {
    let res
    try {
      res = await fetch(new URL('chat/completions', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature: 0.3, response_format: { type: 'json_object' } }),
        signal: AbortSignal.timeout(timeoutMs)
      })
    } catch (err) {
      if (err.name === 'TimeoutError') throw new HttpError(504, 'The AI took too long to answer. Try a smaller request.')
      throw new HttpError(502, 'The AI service could not be reached. Check the internet connection and try again.')
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`AI request failed (${res.status}): ${detail.slice(0, 500)}`)
      throw aiError(res.status, providerMessage(detail), model)
    }
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? ''
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
    model: env.AI_MODEL || DEFAULT_MODEL
  })
}
