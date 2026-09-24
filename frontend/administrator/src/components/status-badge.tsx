import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const tone: Record<string, string> = {
  ACTIVE: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ENABLED: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ACCEPTED: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ONBOARDING: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  PENDING: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  INVITED: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  BETA: 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300',
  TRIAL: 'border-transparent bg-[#00c2b2]/15 text-[#0a7d73] dark:text-[#7ef0e6]',
  FREE: 'border-transparent bg-secondary text-secondary-foreground',
  PAID: 'border-transparent bg-primary text-primary-foreground',
  SAAS: 'border-transparent bg-[#00c2b2]/15 text-[#0a7d73] dark:text-[#7ef0e6]',
  ON_PREMISES: 'border-transparent bg-secondary text-secondary-foreground',
  EXPIRED: 'bg-destructive/10 text-destructive',
  SUSPENDED: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  INACTIVE: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-destructive/10 text-destructive',
  RETIRED: 'bg-secondary text-secondary-foreground',
  COMPLETE: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  IN_PROGRESS: 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300',
  NOT_STARTED: 'border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-300',
  NOT_ENTITLED: 'border-border text-muted-foreground',
}

export function StatusBadge({ value }: { value: string }) {
  const label =
    value === 'NOT_STARTED'
      ? 'Not started'
      : value === 'IN_PROGRESS'
        ? 'In progress'
        : value === 'COMPLETE'
          ? 'Complete'
          : value === 'EXPIRED'
            ? 'Expired'
            : value === 'SUSPENDED'
              ? 'Suspended'
              : value === 'NOT_ENTITLED'
                ? 'Not entitled'
                : value.replaceAll('_', ' ')

  return (
    <Badge variant="outline" className={cn('font-medium tracking-wide', tone[value])}>
      {label}
    </Badge>
  )
}
