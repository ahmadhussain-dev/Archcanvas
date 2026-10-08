// Feet and inches the way builders write them: 25'-6"
export function ftin(feet) {
  let f = Math.floor(feet)
  let inches = Math.round((feet - f) * 12)
  if (inches === 12) {
    f += 1
    inches = 0
  }
  return `${f}'-${inches}"`
}

// Reads 25, 25.5, 25'6", 25'-6" or 25 ft 6 in. Returns feet, or NaN.
export function parseFeet(text) {
  const s = String(text).trim().toLowerCase()
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s)
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*-?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/)
  if (!m) return NaN
  return Number(m[1]) + (m[2] ? Number(m[2]) / 12 : 0)
}

const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const dec = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export const num = (n) => int.format(n)
export const num2 = (n) => dec.format(n)

// PKR 55.8 lakh, PKR 1.2 crore, PKR 97,700
export function pkrShort(n) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 10_000_000) return `${sign}PKR ${(abs / 10_000_000).toFixed(2).replace(/\.?0+$/, '')} crore`
  if (abs >= 100_000) return `${sign}PKR ${(abs / 100_000).toFixed(1).replace(/\.0$/, '')} lakh`
  return `${sign}PKR ${int.format(abs)}`
}

export const SQFT_PER_MARLA = 225

export function marla(sqft) {
  const m = sqft / SQFT_PER_MARLA
  return Number.isInteger(m) ? String(m) : m.toFixed(1)
}

export function timeAgo(date) {
  const s = (Date.now() - new Date(date).getTime()) / 1000
  if (s < 60) return 'just now'
  const m = s / 60
  if (m < 60) return `${Math.floor(m)} min ago`
  const h = m / 60
  if (h < 24) return `${Math.floor(h)} hour${Math.floor(h) === 1 ? '' : 's'} ago`
  const d = h / 24
  if (d < 2) return 'yesterday'
  if (d < 7) return `${Math.floor(d)} days ago`
  if (d < 14) return 'last week'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
