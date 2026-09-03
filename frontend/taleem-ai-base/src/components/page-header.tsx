import type { ReactNode } from 'react'
import { PageHero } from '@/components/page-hero'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  badge,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHero eyebrow={eyebrow ?? 'Taleem AI'} title={title} description={description} badge={badge} />
      {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
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
