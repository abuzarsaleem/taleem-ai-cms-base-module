import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { cn, isDisplayableImageUrl } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  ALUMNI: GraduationCap,
  ALUMNI_ADMIN: Shield,
  ADMISSIONS: ClipboardList,
  ACADEMICS: BookOpen,
}

const FALLBACK_ICONS: LucideIcon[] = [LayoutGrid, BookOpen, GraduationCap, ClipboardList]

const TONES = [
  'bg-primary/10 text-primary',
  'bg-accent/15 text-accent',
  'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  'bg-violet-500/12 text-violet-700 dark:text-violet-300',
]

function hashCode(value: string) {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
}

export function ApplicationIcon({
  code,
  logoUrl,
  className,
  size = 'md',
}: {
  code: string
  logoUrl?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const key = code.trim().toUpperCase()
  const box = size === 'sm' ? 'size-8' : 'size-10'

  if (isDisplayableImageUrl(logoUrl)) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn('shrink-0 rounded-xl border border-border object-cover', box, className)}
      />
    )
  }

  const Icon = ICONS[key] ?? FALLBACK_ICONS[hashCode(key) % FALLBACK_ICONS.length]
  const tone = TONES[hashCode(key) % TONES.length]

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-xl', box, tone, className)}
      aria-hidden
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} />
    </span>
  )
}
