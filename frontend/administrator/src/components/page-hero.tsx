import type { ReactNode } from 'react'

export function PageHero({
  eyebrow,
  title,
  description,
  badge,
  media,
}: {
  eyebrow: string
  title: string
  description?: string
  badge?: ReactNode
  media?: ReactNode
}) {
  return (
    <header className="portal-hero relative overflow-hidden rounded-3xl border border-border/60 p-8 shadow-[var(--portal-shadow)] sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-8 size-56 rounded-full bg-[radial-gradient(circle,rgb(12_60_255_/_0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 size-64 rounded-full bg-[radial-gradient(circle,rgb(45_212_191_/_0.16),transparent_70%)]"
      />
      <div className="relative flex items-start gap-5">
        {media ? <div className="shrink-0 pt-1">{media}</div> : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-teal-500 uppercase dark:text-teal-300">
            {eyebrow}
          </p>
          <div className="mt-3.5 min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[2.15rem] leading-[1.12] font-semibold tracking-tight text-foreground sm:text-[2.5rem]">
                {title}
              </h1>
              {badge}
            </div>
            {description ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
