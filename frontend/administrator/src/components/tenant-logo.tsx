import { cn, initialsFromName, isDisplayableImageUrl } from '@/lib/utils'

export function TenantLogo({
  name,
  logoUrl,
  logoDarkUrl,
  className,
  fallbackClassName,
}: {
  name: string
  logoUrl?: string | null
  logoDarkUrl?: string | null
  className?: string
  fallbackClassName?: string
}) {
  const light = isDisplayableImageUrl(logoUrl) ? logoUrl! : undefined
  const dark = isDisplayableImageUrl(logoDarkUrl) ? logoDarkUrl! : undefined

  return (
    <span
      className={cn(
        'relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
        className,
      )}
    >
      {light ? (
        <img
          src={light}
          alt=""
          className={cn('size-full object-contain p-0.5', dark ? 'dark:hidden' : undefined)}
        />
      ) : null}
      {dark ? (
        <img src={dark} alt="" className={cn('size-full object-contain p-0.5', light ? 'hidden dark:block' : undefined)} />
      ) : null}
      {!light && !dark ? (
        <span
          className={cn(
            'flex size-full items-center justify-center bg-[#e8eef8] text-xs font-semibold text-[#19316f] dark:bg-white/10 dark:text-white',
            fallbackClassName,
          )}
        >
          {initialsFromName(name)}
        </span>
      ) : null}
    </span>
  )
}
