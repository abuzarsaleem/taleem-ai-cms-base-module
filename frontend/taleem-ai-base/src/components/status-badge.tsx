import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const tone: Record<string, string> = {
  ACTIVE: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ENABLED: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ACCEPTED: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  ONBOARDING: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  PENDING: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  INVITED: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300',
  TRIAL: 'border-transparent bg-[#00c2b2]/15 text-[#0a7d73] dark:text-[#7ef0e6]',
  FREE: 'border-transparent bg-secondary text-secondary-foreground',
  PAID: 'border-transparent bg-primary text-primary-foreground',
  SAAS: 'border-transparent bg-[#00c2b2]/15 text-[#0a7d73] dark:text-[#7ef0e6]',
  ON_PREMISES: 'border-transparent bg-secondary text-secondary-foreground',
  SUSPENDED: 'bg-destructive/10 text-destructive',
  INACTIVE: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-destructive/10 text-destructive',
  EXPIRED: 'bg-destructive/10 text-destructive',
  RETIRED: 'bg-secondary text-secondary-foreground',
  NOT_ENTITLED: 'border-border text-muted-foreground',
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn('font-medium tracking-wide', tone[value])}>
      {value === 'NOT_ENTITLED' ? 'Not entitled' : value.replaceAll('_', ' ')}
    </Badge>
  )
}
