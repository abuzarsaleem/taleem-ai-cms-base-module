import { parseHexColor } from '@/lib/utils'

export type TenantBrandColors = {
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
}

const BRAND_VARS = [
  '--primary',
  '--primary-foreground',
  '--accent',
  '--accent-foreground',
  '--ring',
  '--foreground',
  '--background',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--muted',
  '--muted-foreground',
  '--secondary',
  '--secondary-foreground',
  '--border',
  '--input',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-ring',
  '--chart-1',
  '--chart-2',
] as const

const LIGHT_FG = '#F4F7FB'
const DARK_FG = '#0B1220'

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.slice(1)
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

function mix(a: string, b: string, amount: number) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * amount, ag + (bg - ag) * amount, ab + (bb - ab) * amount)
}

function luminance(hex: string) {
  const channel = (value: number) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastForeground(hex: string) {
  return luminance(hex) > 0.55 ? DARK_FG : LIGHT_FG
}

function contrastRatio(a: string, b: string) {
  const first = luminance(a)
  const second = luminance(b)
  const [hi, lo] = first > second ? [first, second] : [second, first]
  return (hi + 0.05) / (lo + 0.05)
}

function readableOn(background: string, candidate?: string | null) {
  if (candidate && contrastRatio(background, candidate) >= 3) return candidate
  return contrastForeground(background)
}

function until(hex: string, toward: string, test: (color: string) => boolean) {
  let color = hex
  for (let step = 0; step < 12 && !test(color); step += 1) {
    color = mix(color, toward, 0.18)
  }
  return color
}

function darkSurface(hex: string, maxLuminance: number) {
  return until(hex, '#020617', (color) => luminance(color) <= maxLuminance)
}

function vividOnDark(hex: string, minLuminance = 0.45) {
  return until(hex, '#FFFFFF', (color) => luminance(color) >= minLuminance)
}

export function clearTenantBranding() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const name of BRAND_VARS) root.style.removeProperty(name)
}

export function applyTenantBranding(colors: TenantBrandColors, theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const primary = parseHexColor(colors.primaryColor ?? '')
  const secondary = parseHexColor(colors.secondaryColor ?? '')
  const accent = parseHexColor(colors.accentColor ?? '')

  clearTenantBranding()
  if (!primary && !secondary && !accent) return

  const root = document.documentElement
  const set = (name: (typeof BRAND_VARS)[number], value: string) => root.style.setProperty(name, value)

  if (theme === 'light') {
    if (primary) {
      set('--primary', primary)
      set('--primary-foreground', readableOn(primary, secondary))
      set('--chart-1', primary)
      set('--sidebar', luminance(primary) > 0.45 ? mix(primary, '#000000', 0.42) : primary)
      if (luminance(primary) < 0.4) set('--foreground', primary)
    }
    if (accent) {
      set('--accent', accent)
      set('--accent-foreground', contrastForeground(accent))
      set('--ring', accent)
      set('--sidebar-primary', accent)
      set('--sidebar-primary-foreground', contrastForeground(accent))
      set('--sidebar-ring', accent)
      set('--chart-2', accent)
    }
    if (secondary && luminance(secondary) > 0.82) {
      set('--card', secondary)
      set('--background', mix(secondary, primary ?? '#081B45', 0.06))
    }
    return
  }

  const seed = primary ?? mix(accent ?? '#081B45', '#020617', 0.55)
  const background = darkSurface(mix(seed, '#020617', 0.42), 0.06)
  const card = mix(background, seed, 0.22)
  const muted = mix(background, '#FFFFFF', 0.07)
  const elevated = mix(card, '#FFFFFF', 0.08)
  const border = mix(card, '#FFFFFF', 0.14)
  const foreground =
    secondary && luminance(secondary) > 0.72 ? mix(secondary, '#FFFFFF', 0.08) : '#E8EEF8'
  const mutedForeground = mix(foreground, background, 0.38)
  const highlight = vividOnDark(accent ?? mix(seed, '#FFFFFF', 0.42))
  const action = vividOnDark(accent ?? mix(seed, '#FFFFFF', 0.35), 0.4)

  set('--background', background)
  set('--card', card)
  set('--popover', card)
  set('--muted', muted)
  set('--secondary', elevated)
  set('--border', border)
  set('--input', border)
  set('--foreground', foreground)
  set('--card-foreground', foreground)
  set('--popover-foreground', foreground)
  set('--secondary-foreground', foreground)
  set('--muted-foreground', mutedForeground)
  set('--sidebar', darkSurface(mix(seed, '#000000', 0.28), 0.05))
  set('--sidebar-foreground', mix(foreground, '#FFFFFF', 0.04))

  set('--primary', action)
  set('--primary-foreground', contrastForeground(action))
  set('--accent', highlight)
  set('--accent-foreground', contrastForeground(highlight))
  set('--ring', highlight)
  set('--sidebar-primary', highlight)
  set('--sidebar-primary-foreground', contrastForeground(highlight))
  set('--sidebar-ring', highlight)
  set('--chart-1', action)
  set('--chart-2', highlight)
}
