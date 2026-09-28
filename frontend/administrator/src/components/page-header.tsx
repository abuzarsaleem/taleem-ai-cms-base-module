import type { ReactNode } from 'react'
import { PageHero } from '@/components/page-hero'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  badge,
  media,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  toolbar?: ReactNode
  badge?: ReactNode
  media?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHero
        eyebrow={eyebrow ?? 'Taleem AI'}
        title={title}
        description={description}
        badge={badge}
        media={media}
        actions={actions}
      />
      {toolbar ? <div className="flex flex-wrap items-end gap-3">{toolbar}</div> : null}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

/** Compact labeled control for listing filter bars. */
export function FilterField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
