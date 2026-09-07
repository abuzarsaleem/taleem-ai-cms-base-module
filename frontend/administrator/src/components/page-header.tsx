import type { ReactNode } from 'react'
import { PageHero } from '@/components/page-hero'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  badge,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  toolbar?: ReactNode
  badge?: ReactNode
}) {
  const hasBar = Boolean(toolbar || actions)

  return (
    <div className="flex flex-col gap-4">
      <PageHero eyebrow={eyebrow ?? 'Taleem AI'} title={title} description={description} badge={badge} />
      {hasBar ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">{toolbar}</div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
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
