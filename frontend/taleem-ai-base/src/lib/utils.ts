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
