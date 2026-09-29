import type { ReactNode } from 'react'

/** Shared shell: same padding and height as the Platform Dashboard header. */
export const PAGE_HERO_SURFACE =
  'relative flex min-h-[9.5rem] flex-col justify-center overflow-hidden rounded-xl border border-[#dce6fb] bg-[linear-gradient(105deg,#e2ebff_0%,#eaf1ff_40%,#f3f7ff_72%,#fbfcff_100%)] px-6 py-6 sm:px-7 lg:h-[9.5rem] lg:min-h-0 lg:py-0 dark:border-border dark:bg-[linear-gradient(105deg,#121c38_0%,#0e1833_60%,#0b142b_100%)]'

export function PageHeroGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-16 right-[18%] h-56 w-72 rounded-full bg-[radial-gradient(ellipse,rgb(255_255_255_/_0.85),transparent_70%)] dark:bg-[radial-gradient(ellipse,rgb(12_60_255_/_0.12),transparent_70%)]"
    />
  )
}

export function PageHeroQuote({
  lines,
  caption = 'Taleem AI CMS',
}: {
  lines: string[]
  caption?: string
}) {
  return (
    <figure className="hidden w-fit max-w-[15rem] shrink-0 text-right lg:block">
      <blockquote className="text-[15px] leading-[1.45] font-light text-[#5b6b8f] italic dark:text-slate-300">
        {lines.map((line, index) => (
          <span key={line} className="block">
            {index === 0 ? `“${line}` : line}
            {index === lines.length - 1 ? '”' : ''}
          </span>
        ))}
      </blockquote>
      <div className="mt-2 ml-auto h-px w-28 bg-[#c9d4ea] dark:bg-border" />
      <figcaption className="mt-1.5 text-[10px] font-semibold tracking-[0.18em] text-[#5b6b8f] uppercase dark:text-slate-400">
        {caption}
      </figcaption>
    </figure>
  )
}

export function PageHero({
  eyebrow,
  title,
  description,
  badge,
  media,
  aside,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  badge?: ReactNode
  media?: ReactNode
  aside?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className={PAGE_HERO_SURFACE}>
      <PageHeroGlow />
      <div className="relative flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {media ? <div className="shrink-0">{media}</div> : null}
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-[15px] font-semibold tracking-[0.14em] text-[#00a89d] uppercase dark:text-[#5eead4]">
                {eyebrow}
              </p>
            ) : null}
            <div className={`flex flex-wrap items-center gap-2 ${eyebrow ? 'mt-1.5' : ''}`}>
              <h1 className="text-3xl font-bold tracking-tight text-[#0f1f4d] dark:text-foreground">{title}</h1>
              {badge}
            </div>
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground lg:whitespace-nowrap">{description}</p>
            ) : null}
          </div>
        </div>

        {(aside || actions) && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-6 lg:gap-8">
            {aside}
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-start lg:-mt-1 lg:self-start [&_[data-slot=button]]:h-11 [&_[data-slot=button]]:gap-2 [&_[data-slot=button]]:px-5 [&_[data-slot=button]]:text-[15px] [&_[data-slot=button]]:[&_svg:not([class*='size-'])]:size-[18px]">
                {actions}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}
