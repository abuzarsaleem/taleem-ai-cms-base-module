import { useState } from 'react'
import { Check, ChevronDown, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ApplicationPermission, ApplicationRole } from '@/lib/types'

export function RoleAccordion({
  role,
  permissions,
  permissionByCode,
  defaultOpen,
}: {
  role: ApplicationRole
  permissions: ApplicationPermission[]
  permissionByCode: Record<string, ApplicationPermission>
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  const granted = new Set(role.permissionCodes)
  const unknownCodes = role.permissionCodes.filter((code) => !permissionByCode[code])

  return (
    <details
      className="group rounded-xl border border-border bg-background/70 open:bg-background"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Shield className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{role.roleName}</span>
          <span className="block font-mono text-[11px] text-muted-foreground">{role.roleCode}</span>
        </span>
        <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Badge variant="outline">{role.roleType}</Badge>
          <Badge variant="secondary">
            {granted.size} permission{granted.size === 1 ? '' : 's'}
          </Badge>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>

      <div className="border-t border-border px-4 py-4">
        {role.description ? <p className="mb-3 text-sm text-muted-foreground">{role.description}</p> : null}

        {permissions.length ? (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {permissions.map((permission) => {
              const on = granted.has(permission.permissionCode)
              return (
                <li
                  key={permission.id}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm',
                    on ? 'bg-accent/8' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border',
                      on
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border bg-background',
                    )}
                    aria-hidden
                  >
                    {on ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block leading-tight', on && 'font-medium text-foreground')}>
                      {permission.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{permission.permissionCode}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : role.permissionCodes.length ? null : (
          <p className="text-sm text-muted-foreground">No permissions attached to this role.</p>
        )}
        {unknownCodes.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {unknownCodes.map((code) => (
              <Badge key={code} variant="secondary">
                {code}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  )
}
