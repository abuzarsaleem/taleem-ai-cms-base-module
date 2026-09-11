import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/field'
import { ResourceFormLayout } from '@/components/resource-workspace'
import { EmptyState } from '@/components/page-header'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useOwnTenant } from '@/lib/use-own-tenant'
import {
  ApplicationAccessStatus,
  MembershipStatus,
  type ApplicationPermission,
  type ApplicationRole,
  type TenantMembership,
} from '@/lib/types'
import { applicationAccessService, membershipService } from '@/services/platform'

const emptyDraft = {
  userId: '',
  applicationId: '',
  roleId: '',
  status: ApplicationAccessStatus.ACTIVE as string,
  isDefault: false,
}

export function TenantApplicationAccessFormPage() {
  const navigate = useNavigate()
  const { assignmentId } = useParams()
  const [searchParams] = useSearchParams()
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const isEdit = Boolean(assignmentId)
  const presetApplicationId = searchParams.get('applicationId') ?? ''

  const [members, setMembers] = useState<TenantMembership[]>([])
  const [roles, setRoles] = useState<ApplicationRole[]>([])
  const [permissions, setPermissions] = useState<ApplicationPermission[]>([])
  const [draft, setDraft] = useState({ ...emptyDraft, applicationId: presetApplicationId })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const applications = tenant?.applications ?? []
  const selectedApplication = applications.find((app) => app.applicationId === draft.applicationId)
  const activeMembers = useMemo(
    () => members.filter((row) => row.status === MembershipStatus.ACTIVE),
    [members],
  )
  const permissionByCode = useMemo(
    () => Object.fromEntries(permissions.map((permission) => [permission.permissionCode, permission])),
    [permissions],
  )
  const backTo = selectedApplication
    ? `/tenant/application-access/${selectedApplication.applicationId}`
    : '/tenant/application-access'

  useEffect(() => {
    if (tenantLoading) return
    if (!tenantId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    const load = async () => {
      const membershipPage = await membershipService.list(tenantId)
      if (cancelled) return
      setMembers(membershipPage.data)

      if (assignmentId) {
        const row = await applicationAccessService.get(tenantId, assignmentId)
        if (cancelled) return
        setDraft({
          userId: row.userId,
          applicationId: row.applicationId,
          roleId: row.roleId,
          status: row.status,
          isDefault: row.isDefault,
        })
      }
    }

    load()
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) {
          navigate('/tenant/application-access', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [assignmentId, navigate, tenantId, tenantLoading])

  useEffect(() => {
    if (!tenantId || !selectedApplication) {
      setRoles([])
      setPermissions([])
      return
    }
    let cancelled = false
    Promise.all([
      applicationAccessService.roles(tenantId, selectedApplication.applicationCode),
      applicationAccessService.permissions(tenantId, selectedApplication.applicationId),
    ])
      .then(([nextRoles, nextPermissions]) => {
        if (cancelled) return
        setRoles(nextRoles)
        setPermissions(nextPermissions)
      })
      .catch((error) => {
        if (!cancelled) {
          setRoles([])
          setPermissions([])
          toast.error(errorMessage(error))
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedApplication, tenantId])

  async function save() {
    if (!tenantId) return
    if (!isEdit && (!draft.userId || !draft.applicationId || !draft.roleId)) {
      toast.error('Member, application, and role are required')
      return
    }
    if (isEdit && !draft.roleId) {
      toast.error('Select a role')
      return
    }
    setBusy(true)
    try {
      if (isEdit && assignmentId) {
        await applicationAccessService.update(tenantId, assignmentId, {
          roleId: draft.roleId,
          status: draft.status as ApplicationAccessStatus,
          isDefault: draft.isDefault,
        })
        toast.success('Application access updated')
      } else {
        await applicationAccessService.create(tenantId, {
          userId: draft.userId,
          applicationId: draft.applicationId,
          roleId: draft.roleId,
          isDefault: draft.isDefault,
        })
        toast.success('Application access assigned')
      }
      navigate(backTo)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
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

  return (
    <ResourceFormLayout
      eyebrow={tenant.tenantCode}
      title={isEdit ? 'Edit application access' : 'Assign application access'}
      description={
        isEdit
          ? 'Change the role, status, or default flag for this member.'
          : 'Choose an entitled application, pick a role from its permissions, and assign it to a member.'
      }
      backTo={backTo}
      backLabel="Back"
    >
      <div className="grid gap-5">
        <Field label="Member" required>
          <Select
            value={draft.userId || undefined}
            disabled={isEdit}
            onValueChange={(userId) => setDraft((current) => ({ ...current, userId }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a member" />
            </SelectTrigger>
            <SelectContent>
              {(isEdit ? members : activeMembers).map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.userFullName || member.userEmail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Application" required>
          <Select
            value={draft.applicationId || undefined}
            disabled={isEdit || Boolean(presetApplicationId)}
            onValueChange={(applicationId) =>
              setDraft((current) => ({ ...current, applicationId, roleId: '' }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an application" />
            </SelectTrigger>
            <SelectContent>
              {applications.map((app) => (
                <SelectItem key={app.applicationId} value={app.applicationId}>
                  {app.name} ({app.applicationCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {selectedApplication ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <ApplicationIcon
              code={selectedApplication.applicationCode}
              logoUrl={selectedApplication.logoUrl}
            />
            <div className="min-w-0">
              <p className="font-medium">{selectedApplication.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{selectedApplication.applicationCode}</p>
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium">
            Role <span className="text-destructive">*</span>
          </p>
          {selectedApplication ? (
            roles.length ? (
              <ul className="space-y-2">
                {roles.map((role) => {
                  const selected = draft.roleId === role.id
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, roleId: role.id }))}
                        className={cn(
                          'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                          selected
                            ? 'border-accent bg-accent/8'
                            : 'border-border bg-background/70 hover:border-accent/40',
                        )}
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <span className="block font-medium">{role.roleName}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">{role.roleCode}</span>
                          </span>
                          <Badge variant="outline">{role.roleType}</Badge>
                        </span>
                        {role.description ? (
                          <span className="mt-2 block text-sm text-muted-foreground">{role.description}</span>
                        ) : null}
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {role.permissionCodes.length ? (
                            role.permissionCodes.map((code) => (
                              <Badge key={code} variant="secondary">
                                {permissionByCode[code]?.name ?? code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No permissions on this role.</span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No roles are registered for this application yet.
              </p>
            )
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Select an application to see its roles and permissions.
            </p>
          )}
        </div>

        {isEdit ? (
          <Field label="Status">
            <Select
              value={draft.status}
              onValueChange={(status) => setDraft((current) => ({ ...current, status }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ApplicationAccessStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={ApplicationAccessStatus.SUSPENDED}>Suspended</SelectItem>
                <SelectItem value={ApplicationAccessStatus.REVOKED}>Revoked</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={draft.isDefault}
            onCheckedChange={(value) => setDraft((current) => ({ ...current, isDefault: value === true }))}
          />
          Default application for this member (opens automatically after sign-in)
        </label>

        <div className="flex justify-end">
          <Button
            disabled={busy || !draft.roleId || (!isEdit && (!draft.userId || !draft.applicationId))}
            onClick={() => void save()}
          >
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Assign access'}
          </Button>
        </div>
      </div>
    </ResourceFormLayout>
  )
}
