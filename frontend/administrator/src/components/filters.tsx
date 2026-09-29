import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'

/** `!` beats the global `[data-slot="input"]` radius rule in index.css. */
const FILTER_SURFACE =
  'h-12 rounded-lg! border border-border bg-card shadow-none transition-colors hover:border-input dark:bg-card'

export function FilterBar({
  children,
  onClear,
  canClear = true,
  trailing,
  className,
}: {
  children: ReactNode
  onClear?: () => void
  canClear?: boolean
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
      {onClear || trailing ? (
        <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-3 font-medium text-primary hover:bg-primary/5 hover:text-primary disabled:text-muted-foreground"
              disabled={!canClear}
              onClick={onClear}
            >
              Clear filters
            </Button>
          ) : null}
          {trailing}
        </div>
      ) : null}
    </div>
  )
}

export function FilterSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative min-w-0 flex-1 sm:min-w-[16rem]', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={placeholder}
        className={cn(FILTER_SURFACE, 'pl-10 text-sm')}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  searchPlaceholder,
  className,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  searchPlaceholder?: string
  className?: string
}) {
  return (
    <SearchableSelect
      triggerLabel={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder="All"
      searchPlaceholder={searchPlaceholder ?? `Search ${label.toLowerCase()}...`}
      className={cn('w-full sm:w-44', className)}
      triggerClassName={cn(FILTER_SURFACE, 'px-3')}
    />
  )
}
