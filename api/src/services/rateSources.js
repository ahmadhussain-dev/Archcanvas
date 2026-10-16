// Online price lists the daily check reads. Each source gives prices for the
// cities it lists (`byCity`) and a Pakistan-wide figure (`national`) used for
// cities no list covers. To add or swap a source, add an entry here with its
// own parse(); nothing else needs to change.
import { readTables, readPriceColumn, median } from '../lib/priceTables.js'

const CITY = /\bcity\b/

function nationalFrom(values, { min, max }) {
  if (!values) return null
  return median(Object.values(values).filter((v) => v >= min && v <= max))
}

export const RATE_SOURCES = [
  {
    key: 'cement',
    name: 'ICONS cement rate today',
    url: 'https://icons.com.pk/cement-rate-today',
    // A 50 kg bag of ordinary grey cement.
    min: 500,
    max: 5000,
    parse(html) {
      const tables = readTables(html)
      const byCity = readPriceColumn(tables, { first: CITY, price: /price|bag/ })
      const brands = readPriceColumn(tables, { first: /company|brand/, price: /price|bag/ })
      return { byCity, national: nationalFrom(byCity, this) ?? nationalFrom(brands, this) }
    }
  },
  {
    key: 'steel',
    name: 'ICONS steel rate today',
    url: 'https://icons.com.pk/steel-rate-today',
    // Steel bars (sariya) per metric ton.
    min: 100_000,
    max: 800_000,
    parse(html) {
      const tables = readTables(html)
      const perTonOrKg = [/ton/, { pattern: /kg/, multiplier: 1000 }]
      const byCity = readPriceColumn(tables, { first: CITY, price: perTonOrKg })
      const brands = readPriceColumn(tables, { first: /brand/, price: [/grade 60.*ton/, /grade 40.*ton/, ...perTonOrKg] })
      return { byCity, national: nationalFrom(byCity, this) ?? nationalFrom(brands, this) }
    }
  }
]

// Downloads a page as text. Some sites refuse requests without a browser-like agent.
export async function fetchPage(url, { timeoutMs = 20_000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (ArchCanvas price check; once a day)', Accept: 'text/html' },
    signal: AbortSignal.timeout(timeoutMs)
  })
  if (!res.ok) throw new Error(`The site answered ${res.status}`)
  return res.text()
}
