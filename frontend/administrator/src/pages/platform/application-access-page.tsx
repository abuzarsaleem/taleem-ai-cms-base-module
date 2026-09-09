import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, KeyRound, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { EmptyState, PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApplicationPermission, ApplicationRole, CatalogApplication } from '@/lib/types'
import { applicationAccessService, applicationService } from '@/services/platform'

export function ApplicationAccessPage() {
  const { applicationId = '' } = useParams()
  const [app, setApp] = useState<CatalogApplication | null>(null)
  const [roles, setRoles] = useState<ApplicationRole[]>([])
  const [permissions, setPermissions] = useState<ApplicationPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!applicationId) {
      setMissing(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setMissing(false)
    setApp(null)

    applicationService
      .get(applicationId)
      .then(async (nextApp) => {
        const [nextRoles, nextPermissions] = await Promise.all([
          applicationAccessService.roles(nextApp.applicationCode),
          applicationAccessService.permissions(nextApp.id),
        ])
        if (cancelled) return
        setApp(nextApp)
        setRoles(nextRoles)
        setPermissions(nextPermissions)
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) setMissing(true)
        else toast.error(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [applicationId])

  const permissionByCode = useMemo(
    () => Object.fromEntries(permissions.map((permission) => [permission.permissionCode, permission])),
    [permissions],
  )

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (missing || !app) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Button variant="outline" className="w-fit" asChild>
          <Link to="/platform/applications">
            <ArrowLeft />
            Back to catalogue
          </Link>
        </Button>
        <EmptyState
          title="Application not found"
          description="This catalogue record is missing or you no longer have access to it."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={app.applicationCode}
        title={app.name}
        description={
          app.description ||
          'Roles are named sets of permissions. Tenant admins assign a role when they grant a member access to this application.'
        }
        badge={<StatusBadge value={app.status} />}
        media={
          <div className="rounded-2xl bg-white p-1 shadow-sm">
            <ApplicationIcon
              code={app.applicationCode}
              logoUrl={app.logoUrl}
              className="size-14 rounded-[0.9rem]"
            />
          </div>
        }
        toolbar={
          <p className="text-sm text-muted-foreground">
            {roles.length} role{roles.length === 1 ? '' : 's'} · {permissions.length} permission
            {permissions.length === 1 ? '' : 's'}
          </p>
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/platform/applications">
              <ArrowLeft />
              Back to catalogue
            </Link>
          </Button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section className="portal-card p-5 sm:p-6">
          <SectionTitle
            title="Roles"
            description="Each role grants a subset of the permissions on the right. Adding a role later means picking a name and ticking those permissions."
          />
          {roles.length ? (
            <div className="space-y-2">
              {roles.map((role, index) => (
                <RoleAccordion
                  key={role.id}
                  role={role}
                  permissions={permissions}
                  permissionByCode={permissionByCode}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No system roles are registered for this application yet.
            </p>
          )}
        </section>

        <section className="portal-card p-5 sm:p-6 xl:sticky xl:top-6">
          <SectionTitle
            title="Permissions"
            description="The capabilities available to compose into roles."
          />
          {permissions.length ? (
            <ul className="space-y-2">
              {permissions.map((permission) => (
                <li
                  key={permission.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/70 px-3.5 py-3"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <KeyRound className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{permission.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{permission.permissionCode}</p>
                    {permission.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{permission.description}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No permissions are registered for this application yet.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function RoleAccordion({
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
  const granted = new Set(role.permissionCodes)
  const unknownCodes = role.permissionCodes.filter((code) => !permissionByCode[code])

  return (
    <details
      className="group rounded-xl border border-border bg-background/70 open:bg-background"
      defaultOpen={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00c2b2]/15 text-[#0a7d73] dark:text-[#7ef0e6]">
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
