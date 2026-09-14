import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { EmptyState, PageHeader } from '@/components/page-header'
import { RoleAccordion } from '@/components/role-accordion'
import { SectionTitle } from '@/components/section-title'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { useOwnTenant } from '@/lib/use-own-tenant'
import type { ApplicationPermission, ApplicationRole } from '@/lib/types'
import { applicationAccessService } from '@/services/platform'

export function TenantApplicationAccessRolesPage() {
  const { applicationId = '' } = useParams()
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const [roles, setRoles] = useState<ApplicationRole[]>([])
  const [permissions, setPermissions] = useState<ApplicationPermission[]>([])
  const [loading, setLoading] = useState(true)

  const app = tenant?.applications?.find((item) => item.applicationId === applicationId)
  const applicationCode = app?.applicationCode
  const backTo = `/tenant/application-access/${applicationId}`

  const reload = useCallback(async () => {
    if (!tenantId || !applicationId || !applicationCode) return
    const [nextRoles, nextPermissions] = await Promise.all([
      applicationAccessService.roles(tenantId, applicationCode),
      applicationAccessService.permissions(tenantId, applicationId),
    ])
    setRoles(nextRoles)
    setPermissions(nextPermissions)
  }, [applicationCode, applicationId, tenantId])

  useEffect(() => {
    if (tenantLoading) return
    if (!tenantId || !applicationCode) {
      setLoading(false)
      return
    }
    setLoading(true)
    reload()
      .catch((error) => {
        if (!(error instanceof ApiError && (error.status === 404 || error.status === 403))) {
          toast.error(errorMessage(error))
        }
      })
      .finally(() => setLoading(false))
  }, [applicationCode, reload, tenantId, tenantLoading])

  const permissionByCode = useMemo(
    () => Object.fromEntries(permissions.map((permission) => [permission.permissionCode, permission])),
    [permissions],
  )

  if (tenantLoading || loading) {
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

  if (missing || !tenant || !tenantId) {
    return (
      <EmptyState
        title="No institution assigned"
        description="This account is not an active member of a tenant. Ask a platform administrator to invite you."
      />
    )
  }

  if (!app) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Button variant="outline" className="w-fit" asChild>
          <Link to="/tenant/application-access">
            <ArrowLeft />
            Back to application access
          </Link>
        </Button>
        <EmptyState
          title="Application not assigned"
          description="This application is not entitled for your institution."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={app.applicationCode}
        title="Roles & permissions"
        description={`System roles and capabilities for ${app.name}. Members receive one of these roles when assigned.`}
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
            <Link to={backTo}>
              <ArrowLeft />
              Back to application
            </Link>
          </Button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section className="portal-card p-5 sm:p-6">
          <SectionTitle
            title="Roles"
            description="Open a role to see which permissions it includes."
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
          <SectionTitle title="Permissions" description="Capabilities this application exposes for its roles." />
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
