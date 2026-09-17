import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Field({
  label,
  children,
  className,
  hint,
  error,
  required,
}: {
  label: string
  children: ReactNode
  className?: string
  hint?: string
  error?: string
  required?: boolean
}) {
  return (
    <div className={cn('relative grid gap-1', className)}>
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="absolute top-full left-0 mt-1 line-clamp-2 text-xs leading-4 text-destructive">{error}</p>
      ) : hint ? (
        <p className="absolute top-full left-0 mt-1 line-clamp-1 text-xs leading-4 text-muted-foreground" title={hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2">{children}</div>
}
