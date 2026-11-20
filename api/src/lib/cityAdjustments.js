// How much dearer or cheaper building is in each region than the national
// rates (lib/localPrices.js). One simple percentage moves the whole estimate:
// +8 means 8% above the national figure, -10 means 10% below.
//
// To change a percentage, an admin can edit it on /admin/prices (saved in the
// database), or change `pct` here for the default. The defaults follow the
// PBS city construction input prices (bricks, sand, steel, mason wages, Jan
// and Sep 2026) and the published 10 Marla grey structure rates per city
// (Zameen, DBL, Glorious, Zell; see docs/price-sources.md). They are rounded
// on purpose: the gap between two cities is smaller than the gap between two
// contractors in the same city.
import { CITIES, findCity } from './cities.js'

export const REGIONS = [
  { key: 'potohar', label: 'Islamabad, Rawalpindi and nearby', pct: 8 },
  { key: 'lahore', label: 'Lahore, Gujranwala, Sialkot and nearby', pct: 2 },
  { key: 'karachi', label: 'Karachi', pct: 0 },
  { key: 'central-punjab', label: 'Faisalabad and central Punjab', pct: -3 },
  { key: 'kp', label: 'Peshawar and Khyber Pakhtunkhwa', pct: -4 },
  { key: 'balochistan', label: 'Quetta and Balochistan', pct: -4 },
  { key: 'south-punjab', label: 'Multan and south Punjab', pct: -5 },
  { key: 'sindh', label: 'Hyderabad, Sukkur and the rest of Sindh', pct: -10 }
]

// Any city not named here is in central Punjab.
const REGION_BY_CITY = {
  Lahore: 'lahore', Gujranwala: 'lahore', Sialkot: 'lahore', Sheikhupura: 'lahore', Kasur: 'lahore',
  Gujrat: 'lahore', Kamoke: 'lahore', Hafizabad: 'lahore', Okara: 'lahore',
  Karachi: 'karachi',
  Hyderabad: 'sindh', Sukkur: 'sindh', Larkana: 'sindh', Nawabshah: 'sindh', 'Mirpur Khas': 'sindh',
  Islamabad: 'potohar', Rawalpindi: 'potohar', 'Wah Cantonment': 'potohar', Abbottabad: 'potohar', Jhelum: 'potohar',
  Multan: 'south-punjab', Bahawalpur: 'south-punjab', 'Rahim Yar Khan': 'south-punjab', 'Dera Ghazi Khan': 'south-punjab',
  Sadiqabad: 'south-punjab', Burewala: 'south-punjab', Khanewal: 'south-punjab', Muzaffargarh: 'south-punjab',
  Peshawar: 'kp', Mardan: 'kp', Mingora: 'kp', Kohat: 'kp', 'Dera Ismail Khan': 'kp',
  Quetta: 'balochistan', Turbat: 'balochistan'
}

export const REGION_KEYS = REGIONS.map((r) => r.key)
export const ADJUSTMENT_LIMITS = { min: -30, max: 30 }

export function regionOf(city) {
  const name = findCity(city)?.name ?? city
  return REGION_BY_CITY[name] ?? 'central-punjab'
}

// overrides: { [region]: pct } saved by an admin. Returns { region, label, pct, isDefault }.
export function adjustmentFor(city, overrides = {}) {
  const region = REGIONS.find((r) => r.key === regionOf(city))
  const saved = overrides[region.key]
  const pct = Number.isFinite(saved) ? saved : region.pct
  return { region: region.key, label: region.label, pct, isDefault: pct === region.pct }
}

// Every region with its percentage and cities, for the admin page and the estimate notes.
export function regionTable(overrides = {}) {
  return REGIONS.map((r) => {
    const saved = overrides[r.key]
    const pct = Number.isFinite(saved) ? saved : r.pct
    return {
      key: r.key,
      label: r.label,
      pct,
      defaultPct: r.pct,
      cities: CITIES.filter((c) => regionOf(c.name) === r.key).map((c) => c.name)
    }
  })
}
