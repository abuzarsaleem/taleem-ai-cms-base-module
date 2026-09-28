import { ArrowDownRight, Minus, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatMetricTone = 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'slate'

const TONE: Record<
  StatMetricTone,
  { icon: string; trendUp: string; trendFlat: string; trendDown: string }
> = {
  blue: {
    icon: 'bg-[#e8f0ff] text-[#2563eb] dark:bg-blue-500/15 dark:text-blue-300',
    trendUp: 'text-[#16a34a]',
    trendFlat: 'text-[#f59e0b]',
    trendDown: 'text-[#e11d48]',
  },
  green: {
    icon: 'bg-[#e8f8ef] text-[#16a34a] dark:bg-emerald-500/15 dark:text-emerald-300',
    trendUp: 'text-[#16a34a]',
    trendFlat: 'text-[#f59e0b]',
    trendDown: 'text-[#e11d48]',
  },
  amber: {
    icon: 'bg-[#fff4e5] text-[#ea580c] dark:bg-amber-500/15 dark:text-amber-300',
    trendUp: 'text-[#16a34a]',
    trendFlat: 'text-[#f59e0b]',
    trendDown: 'text-[#e11d48]',
  },
  violet: {
    icon: 'bg-[#f3e8ff] text-[#7c3aed] dark:bg-violet-500/15 dark:text-violet-300',
    trendUp: 'text-[#16a34a]',
    trendFlat: 'text-[#f59e0b]',
    trendDown: 'text-[#e11d48]',
  },
  rose: {
    icon: 'bg-[#ffe8ec] text-[#e11d48] dark:bg-rose-500/15 dark:text-rose-300',
    trendUp: 'text-[#e11d48]',
    trendFlat: 'text-[#f59e0b]',
    trendDown: 'text-[#e11d48]',
  },
  slate: {
    icon: 'bg-[#eef2f7] text-[#475569] dark:bg-slate-500/15 dark:text-slate-300',
    trendUp: 'text-[#16a34a]',
    trendFlat: 'text-[#f59e0b]',
    trendDown: 'text-[#e11d48]',
  },
}

function TrendRow({
  delta,
  tone,
}: {
  delta: number
  tone: StatMetricTone
}) {
  const styles = TONE[tone]

  if (delta === 0) {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[0.6875rem] leading-tight sm:text-xs">
        <span className={cn('inline-flex items-center gap-0.5 font-semibold', styles.trendFlat)}>
          <Minus className="size-3.5" strokeWidth={2.5} />
          0
        </span>
        <span className="text-[#94a3b8]">vs last month</span>
      </p>
    )
  }

  const up = delta > 0
  const trendClass = up ? styles.trendUp : styles.trendDown

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[0.6875rem] leading-tight sm:text-xs">
      <span className={cn('inline-flex items-center gap-0.5 font-semibold', trendClass)}>
        {up ? (
          <TrendingUp className="size-3.5" strokeWidth={2.25} />
        ) : (
          <ArrowDownRight className="size-3.5" strokeWidth={2.25} />
        )}
        {up ? `+${delta}` : delta}
      </span>
      <span className="text-[#94a3b8]">vs last month</span>
    </p>
  )
}

export function StatMetricCard({
  title,
  value,
  delta,
  icon: Icon,
  tone = 'blue',
  hint,
  className,
}: {
  title: string
  value: number | string
  delta?: number
  icon: LucideIcon
  tone?: StatMetricTone
  hint?: string
  className?: string
}) {
  const styles = TONE[tone]

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[#e8edf4] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgb(15_23_42_/_0.06)] dark:border-border dark:bg-card sm:px-4 sm:py-4',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11',
          styles.icon,
        )}
      >
        <Icon className="size-[1.05rem] stroke-[1.85] sm:size-[1.15rem]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.8125rem] font-semibold text-[#334155] dark:text-foreground/90">{title}</p>
        <p className="mt-0.5 text-[1.625rem] leading-none font-bold tracking-tight text-[#0f1f4d] tabular-nums dark:text-foreground sm:text-[1.75rem]">
          {value}
        </p>
        {delta !== undefined ? (
          <TrendRow delta={delta} tone={tone} />
        ) : hint ? (
          <p className="mt-2 text-[0.6875rem] leading-tight text-[#94a3b8] sm:text-xs">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}
