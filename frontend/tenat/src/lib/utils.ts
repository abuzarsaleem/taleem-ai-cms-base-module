import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function labelize(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export function dateInputValue(value?: string) {
  if (!value) return ''
  return value.slice(0, 10)
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim())
}

export function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function isDisplayableImageUrl(url?: string | null) {
  if (!url) return false
  return url.startsWith('blob:') || url.startsWith('data:') || /^https?:\/\//i.test(url)
}
