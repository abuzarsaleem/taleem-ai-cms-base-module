export type LocationOption = {
  value: string
  label: string
}

export const COUNTRY_OPTIONS: LocationOption[] = [
  { value: 'PK', label: 'Pakistan' },
]

/** ISO-style province / territory codes used in tenant & address records. */
export const PAKISTAN_PROVINCES: LocationOption[] = [
  { value: 'PB', label: 'Punjab' },
  { value: 'SD', label: 'Sindh' },
  { value: 'KP', label: 'Khyber Pakhtunkhwa' },
  { value: 'BL', label: 'Balochistan' },
  { value: 'IS', label: 'Islamabad Capital Territory' },
  { value: 'GB', label: 'Gilgit-Baltistan' },
  { value: 'AJ', label: 'Azad Jammu & Kashmir' },
]

const PAKISTAN_CITIES: Record<string, string[]> = {
  PB: [
    'Lahore',
    'Faisalabad',
    'Rawalpindi',
    'Multan',
    'Gujranwala',
    'Sialkot',
    'Bahawalpur',
    'Sargodha',
    'Sheikhupura',
    'Jhang',
    'Rahim Yar Khan',
    'Gujrat',
    'Sahiwal',
    'Okara',
    'Wah Cantonment',
    'Dera Ghazi Khan',
    'Kasur',
    'Chiniot',
    'Kamoke',
    'Hafizabad',
  ],
  SD: [
    'Karachi',
    'Hyderabad',
    'Sukkur',
    'Larkana',
    'Nawabshah',
    'Mirpur Khas',
    'Jacobabad',
    'Shikarpur',
    'Khairpur',
    'Dadu',
    'Thatta',
    'Badin',
    'Tando Adam',
    'Kotri',
  ],
  KP: [
    'Peshawar',
    'Mardan',
    'Abbottabad',
    'Swat',
    'Kohat',
    'Dera Ismail Khan',
    'Charsadda',
    'Nowshera',
    'Mansehra',
    'Swabi',
    'Bannu',
    'Chitral',
  ],
  BL: [
    'Quetta',
    'Gwadar',
    'Turbat',
    'Khuzdar',
    'Chaman',
    'Sibi',
    'Zhob',
    'Loralai',
    'Hub',
    'Pishin',
  ],
  IS: ['Islamabad'],
  GB: ['Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Gahkuch', 'Khaplu'],
  AJ: ['Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bhimber', 'Bagh'],
}

export function provinceOptionsForCountry(countryCode: string): LocationOption[] {
  if (countryCode === 'PK') return PAKISTAN_PROVINCES
  return []
}

export function cityOptionsForProvince(countryCode: string, provinceCode: string): LocationOption[] {
  if (countryCode !== 'PK' || !provinceCode) return []
  const cities = PAKISTAN_CITIES[provinceCode] ?? []
  return cities.map((city) => ({ value: city, label: city }))
}

export function provinceLabel(code: string): string {
  return PAKISTAN_PROVINCES.find((row) => row.value === code)?.label ?? code
}
