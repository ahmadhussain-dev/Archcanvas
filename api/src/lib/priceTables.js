// Reads price tables out of a web page's HTML. Rate websites change their
// styling often but keep plain <table> markup, so we only rely on the table
// headings ("City", "Price per bag"), never on CSS classes or positions.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—' }

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(n) ? String.fromCodePoint(n) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

function cellText(html) {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()
}

// Every <table> as a list of rows, each row a list of cell texts.
export function readTables(html) {
  const clean = String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, '')
  const tables = []
  for (const [table] of clean.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const rows = []
    for (const [row] of table.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
      const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => cellText(m[1]))
      if (cells.length) rows.push(cells)
    }
    if (rows.length > 1) tables.push(rows)
  }
  return tables
}

// "Rs. 1,400 – 1,550" → 1475 (middle of a range), "246,000" → 246000, "N/A" → null.
export function parsePrice(text) {
  const numbers = [...String(text).matchAll(/\d[\d,]*(?:\.\d+)?/g)]
    .map((m) => Number(m[0].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!numbers.length) return null
  const [low, high] = numbers
  return high !== undefined && high >= low ? (low + high) / 2 : low
}

export function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Finds the first table whose heading row has a cell matching `first` and a cell
// matching `price`, and reads { [first column text]: price × multiplier }.
// `price` may be a list of patterns, tried in order (for example "per ton" before "per kg").
export function readPriceColumn(tables, { first, price, multiplier = 1 }) {
  const patterns = (Array.isArray(price) ? price : [price]).map((p) => ({ pattern: p.pattern ?? p, multiplier: p.multiplier ?? multiplier }))
  for (const rows of tables) {
    const head = rows[0].map((c) => c.toLowerCase())
    const nameCol = head.findIndex((c) => first.test(c))
    if (nameCol < 0) continue
    for (const { pattern, multiplier: times } of patterns) {
      const priceCol = head.findIndex((c, i) => i !== nameCol && pattern.test(c))
      if (priceCol < 0) continue
      const values = {}
      for (const row of rows.slice(1)) {
        const name = row[nameCol]
        const value = parsePrice(row[priceCol] ?? '')
        if (name && value !== null) values[name] = Math.round(value * times)
      }
      if (Object.keys(values).length) return values
    }
  }
  return null
}
