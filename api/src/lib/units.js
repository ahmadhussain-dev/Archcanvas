// Pakistani plot units. Government standard: 1 Marla = 225 sq ft, 1 Kanal = 20 Marla.
export const SQFT_PER_MARLA = 225
export const MARLA_PER_KANAL = 20

export function marlaToSqft(marla) {
  return marla * SQFT_PER_MARLA
}

export function sqftToMarla(sqft) {
  return sqft / SQFT_PER_MARLA
}

// Common plot presets with a typical width × depth in feet (editable by the user).
export const PLOT_PRESETS = [
  { key: '1-marla', label: '1 Marla', marla: 1, widthFt: 15, depthFt: 15 },
  { key: '2-marla', label: '2 Marla', marla: 2, widthFt: 15, depthFt: 30 },
  { key: '3-marla', label: '3 Marla', marla: 3, widthFt: 22.5, depthFt: 30 },
  { key: '5-marla', label: '5 Marla', marla: 5, widthFt: 25, depthFt: 45 },
  { key: '7-marla', label: '7 Marla', marla: 7, widthFt: 35, depthFt: 45 },
  { key: '10-marla', label: '10 Marla', marla: 10, widthFt: 30, depthFt: 75 },
  { key: '1-kanal', label: '1 Kanal', marla: 20, widthFt: 50, depthFt: 90 },
  { key: '2-kanal', label: '2 Kanal', marla: 40, widthFt: 100, depthFt: 90 }
]
