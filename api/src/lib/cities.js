// The 40 largest cities of Pakistan by census population (2023), used for
// city-wise material prices. Online price lists only cover the biggest cities,
// so each city names the nearest cities whose prices it borrows, in order.
// The first entry of `near` is the city itself when a source lists it.
export const CITIES = [
  { name: 'Karachi', province: 'Sindh', near: ['Karachi'] },
  { name: 'Lahore', province: 'Punjab', near: ['Lahore'] },
  { name: 'Faisalabad', province: 'Punjab', near: ['Faisalabad', 'Lahore'] },
  { name: 'Rawalpindi', province: 'Punjab', near: ['Rawalpindi', 'Islamabad'] },
  { name: 'Gujranwala', province: 'Punjab', near: ['Gujranwala', 'Lahore'] },
  { name: 'Peshawar', province: 'Khyber Pakhtunkhwa', near: ['Peshawar'] },
  { name: 'Multan', province: 'Punjab', near: ['Multan'] },
  { name: 'Hyderabad', province: 'Sindh', near: ['Karachi'] },
  { name: 'Islamabad', province: 'Islamabad Capital Territory', near: ['Islamabad', 'Rawalpindi'] },
  { name: 'Quetta', province: 'Balochistan', near: ['Quetta', 'Karachi'] },
  { name: 'Bahawalpur', province: 'Punjab', near: ['Multan'] },
  { name: 'Sargodha', province: 'Punjab', near: ['Faisalabad', 'Lahore'] },
  { name: 'Sialkot', province: 'Punjab', near: ['Gujranwala', 'Lahore'] },
  { name: 'Sukkur', province: 'Sindh', near: ['Karachi', 'Multan'] },
  { name: 'Larkana', province: 'Sindh', near: ['Karachi'] },
  { name: 'Rahim Yar Khan', province: 'Punjab', near: ['Multan'] },
  { name: 'Sheikhupura', province: 'Punjab', near: ['Lahore'] },
  { name: 'Jhang', province: 'Punjab', near: ['Faisalabad'] },
  { name: 'Dera Ghazi Khan', province: 'Punjab', near: ['Multan'] },
  { name: 'Gujrat', province: 'Punjab', near: ['Gujranwala', 'Lahore'] },
  { name: 'Sahiwal', province: 'Punjab', near: ['Faisalabad', 'Lahore'] },
  { name: 'Wah Cantonment', province: 'Punjab', near: ['Rawalpindi', 'Islamabad'] },
  { name: 'Mardan', province: 'Khyber Pakhtunkhwa', near: ['Peshawar'] },
  { name: 'Kasur', province: 'Punjab', near: ['Lahore'] },
  { name: 'Okara', province: 'Punjab', near: ['Lahore'] },
  { name: 'Mingora', province: 'Khyber Pakhtunkhwa', near: ['Peshawar'] },
  { name: 'Nawabshah', province: 'Sindh', near: ['Karachi'] },
  { name: 'Chiniot', province: 'Punjab', near: ['Faisalabad'] },
  { name: 'Kamoke', province: 'Punjab', near: ['Gujranwala', 'Lahore'] },
  { name: 'Hafizabad', province: 'Punjab', near: ['Gujranwala', 'Lahore'] },
  { name: 'Sadiqabad', province: 'Punjab', near: ['Multan'] },
  { name: 'Mirpur Khas', province: 'Sindh', near: ['Karachi'] },
  { name: 'Burewala', province: 'Punjab', near: ['Multan'] },
  { name: 'Kohat', province: 'Khyber Pakhtunkhwa', near: ['Peshawar'] },
  { name: 'Khanewal', province: 'Punjab', near: ['Multan'] },
  { name: 'Dera Ismail Khan', province: 'Khyber Pakhtunkhwa', near: ['Multan', 'Peshawar'] },
  { name: 'Turbat', province: 'Balochistan', near: ['Karachi', 'Quetta'] },
  { name: 'Muzaffargarh', province: 'Punjab', near: ['Multan'] },
  { name: 'Abbottabad', province: 'Khyber Pakhtunkhwa', near: ['Islamabad', 'Rawalpindi'] },
  { name: 'Jhelum', province: 'Punjab', near: ['Rawalpindi', 'Islamabad'] }
]

// Where the starting prices were collected, and the fallback for any other city.
export const DEFAULT_CITY = 'Faisalabad'

export const CITY_NAMES = CITIES.map((c) => c.name)

export function findCity(name) {
  const key = String(name ?? '').trim().toLowerCase()
  return CITIES.find((c) => c.name.toLowerCase() === key) ?? null
}
