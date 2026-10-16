import { useApi } from '../lib/useApi.js'

// The 40 cities with their own material prices, grouped by province.
// While the list loads (or if it can't), the current city is still shown.
export default function CitySelect({ value, onChange, className = '', ...props }) {
  const { data } = useApi('/rates/cities')
  const cities = data?.cities ?? []
  const provinces = [...new Set(cities.map((c) => c.province))]
  const known = cities.some((c) => c.name === value)
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)} {...props}>
      {!known && <option value={value}>{value}</option>}
      {provinces.map((p) => (
        <optgroup key={p} label={p}>
          {cities
            .filter((c) => c.province === p)
            .map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
