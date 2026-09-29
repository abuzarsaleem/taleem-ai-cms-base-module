import type { ReactNode } from 'react'
import { PageHero, PageHeroQuote } from '@/components/page-hero'

export function PageHeader({
  eyebrow,
  title,
  description,
  quote,
  actions,
  toolbar,
  badge,
  media,
}: {
  eyebrow?: string
  title: string
  description?: string
  quote?: string[]
  actions?: ReactNode
  toolbar?: ReactNode
  badge?: ReactNode
  media?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        badge={badge}
        media={media}
        aside={quote?.length ? <PageHeroQuote lines={quote} /> : null}
        actions={actions}
      />
      {toolbar ? <div className="flex flex-wrap items-center gap-3">{toolbar}</div> : null}
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
