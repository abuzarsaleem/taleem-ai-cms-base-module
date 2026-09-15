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
    <div className={cn('grid gap-1.5', className)}>
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs leading-4 text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-4 text-muted-foreground" title={hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FieldGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-1 items-start gap-x-4 gap-y-4 sm:grid-cols-2', className)}>
      {children}
    </div>
  )
}
