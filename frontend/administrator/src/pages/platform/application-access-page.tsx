import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, KeyRound, Pencil, Plus, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ApplicationIcon } from '@/components/application-icon'
import { Field } from '@/components/field'
import { EmptyState, PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApplicationPermission, ApplicationRole, CatalogApplication } from '@/lib/types'
import { applicationAccessService, applicationRoleService, applicationService } from '@/services/platform'

type CreateRoleDraft = {
  roleCode: string
  roleName: string
  description: string
  permissionIds: string[]
}

type EditRoleDraft = {
  roleName: string
  description: string
}

const emptyCreateDraft = (): CreateRoleDraft => ({
  roleCode: '',
  roleName: '',
  description: '',
  permissionIds: [],
})

export function ApplicationAccessPage() {
  const { applicationId = '' } = useParams()
  const [app, setApp] = useState<CatalogApplication | null>(null)
  const [roles, setRoles] = useState<ApplicationRole[]>([])
  const [permissions, setPermissions] = useState<ApplicationPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] = useState(emptyCreateDraft)
  const [createBusy, setCreateBusy] = useState(false)
  const [editRole, setEditRole] = useState<ApplicationRole | null>(null)
  const [editDraft, setEditDraft] = useState<EditRoleDraft>({ roleName: '', description: '' })
  const [editBusy, setEditBusy] = useState(false)
  const [permissionsRole, setPermissionsRole] = useState<ApplicationRole | null>(null)
  const [permissionBusyKey, setPermissionBusyKey] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!applicationId) return
    const nextApp = await applicationService.get(applicationId)
    const [nextRoles, nextPermissions] = await Promise.all([
      applicationRoleService.list(applicationId),
      applicationAccessService.permissions(nextApp.id),
    ])
    setApp(nextApp)
    setRoles(nextRoles)
    setPermissions(nextPermissions)
  }, [applicationId])

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

    reload()
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
  }, [applicationId, reload])

  const permissionByCode = useMemo(
    () => Object.fromEntries(permissions.map((permission) => [permission.permissionCode, permission])),
    [permissions],
  )

  function validateCreateDraft() {
    const roleCode = createDraft.roleCode.trim()
    const roleName = createDraft.roleName.trim()
    if (!roleCode) return 'Role code is required'
    if (roleCode.length > 50) return 'Role code must be 50 characters or fewer'
    if (!roleName) return 'Role name is required'
    if (roleName.length > 100) return 'Role name must be 100 characters or fewer'
    if (createDraft.description.length > 255) return 'Description must be 255 characters or fewer'
    return null
  }

  async function createRole() {
    const error = validateCreateDraft()
    if (error) {
      toast.error(error)
      return
    }
    setCreateBusy(true)
    try {
      const created = await applicationRoleService.create(applicationId, {
        roleCode: createDraft.roleCode.trim().toUpperCase(),
        roleName: createDraft.roleName.trim(),
        description: createDraft.description.trim() || undefined,
        permissionIds: createDraft.permissionIds.length ? createDraft.permissionIds : undefined,
      })
      setRoles((current) => [...current, created])
      setCreateOpen(false)
      setCreateDraft(emptyCreateDraft())
      toast.success('Role created')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setCreateBusy(false)
    }
  }

  function openEdit(role: ApplicationRole) {
    setEditRole(role)
    setEditDraft({ roleName: role.roleName, description: role.description ?? '' })
  }

  async function saveEdit() {
    if (!editRole) return
    const roleName = editDraft.roleName.trim()
    if (!roleName) {
      toast.error('Role name is required')
      return
    }
    if (roleName.length > 100) {
      toast.error('Role name must be 100 characters or fewer')
      return
    }
    if (editDraft.description.length > 255) {
      toast.error('Description must be 255 characters or fewer')
      return
    }
    setEditBusy(true)
    try {
      const updated = await applicationRoleService.update(applicationId, editRole.id, {
        roleName,
        description: editDraft.description.trim() || undefined,
      })
      setRoles((current) => current.map((row) => (row.id === updated.id ? updated : row)))
      setEditRole(null)
      toast.success('Role updated')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setEditBusy(false)
    }
  }

  function syncRole(updated: ApplicationRole) {
    setRoles((current) => current.map((row) => (row.id === updated.id ? updated : row)))
    setPermissionsRole((current) => (current?.id === updated.id ? updated : current))
    setEditRole((current) => (current?.id === updated.id ? updated : current))
  }

  async function setRolePermission(
    role: ApplicationRole,
    permission: ApplicationPermission,
    grant: boolean,
  ) {
    const key = `${role.id}:${permission.id}`
    setPermissionBusyKey(key)
    try {
      const updated = grant
        ? await applicationRoleService.addPermissions(applicationId, role.id, [permission.id])
        : await applicationRoleService.removePermission(applicationId, role.id, permission.id)
      syncRole(updated)
      toast.success(grant ? 'Permission added to role' : 'Permission removed from role')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setPermissionBusyKey(null)
    }
  }

  function openPermissions(role: ApplicationRole) {
    setPermissionsRole(roles.find((row) => row.id === role.id) ?? role)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-2">
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
          'Create system roles and attach permissions. Tenant admins assign these roles when granting application access.'
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
          <>
            <Button variant="outline" asChild>
              <Link to="/platform/applications">
                <ArrowLeft />
                Back to catalogue
              </Link>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Create role
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="portal-card p-5 sm:p-6">
          <SectionTitle
            title="Roles"
            description="System roles for this application. Edit details or toggle permissions for each role."
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
                  permissionBusyKey={permissionBusyKey}
                  onEdit={() => openEdit(role)}
                  onManagePermissions={() => openPermissions(role)}
                  onSetPermission={(permission, grant) => void setRolePermission(role, permission, grant)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">No roles yet for this application.</p>
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus />
                Create first role
              </Button>
            </div>
          )}
        </section>

        <section className="portal-card p-5 sm:p-6">
          <SectionTitle
            title="Permissions"
            description="Application capabilities you can attach to roles."
          />
          {permissions.length ? (
            <div className="space-y-2">
              {permissions.map((permission, index) => (
                <PermissionAccordion key={permission.id} permission={permission} defaultOpen={index === 0} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No permissions are registered for this application yet.
            </p>
          )}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>
              Add a system role for {app.name}. Role code is stored uppercase and cannot be changed later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Role code" required>
              <Input
                value={createDraft.roleCode}
                maxLength={50}
                placeholder="ALUMNI_MEMBER"
                onChange={(e) => setCreateDraft((current) => ({ ...current, roleCode: e.target.value }))}
              />
            </Field>
            <Field label="Role name" required>
              <Input
                value={createDraft.roleName}
                maxLength={100}
                placeholder="Alumni member"
                onChange={(e) => setCreateDraft((current) => ({ ...current, roleName: e.target.value }))}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={createDraft.description}
                maxLength={255}
                rows={3}
                onChange={(e) => setCreateDraft((current) => ({ ...current, description: e.target.value }))}
              />
            </Field>
            {permissions.length ? (
              <Field label="Permissions">
                <p className="text-xs text-muted-foreground">
                  Optional. You can also attach permissions after creating the role.
                </p>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                  {permissions.map((permission) => {
                    const checked = createDraft.permissionIds.includes(permission.id)
                    return (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          className="mt-0.5"
                          onCheckedChange={(value) =>
                            setCreateDraft((current) => ({
                              ...current,
                              permissionIds:
                                value === true
                                  ? [...current.permissionIds, permission.id]
                                  : current.permissionIds.filter((id) => id !== permission.id),
                            }))
                          }
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block font-medium">{permission.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{permission.permissionCode}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </Field>
            ) : null}
          </div>
          <DialogFooter>
            <Button disabled={createBusy} onClick={() => void createRole()}>
              {createBusy ? 'Creating…' : 'Create role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editRole)} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              {editRole ? (
                <>
                  Update <span className="font-mono">{editRole.roleCode}</span>. Use Manage permissions to add or
                  remove features.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Role name" required>
              <Input
                value={editDraft.roleName}
                maxLength={100}
                onChange={(e) => setEditDraft((current) => ({ ...current, roleName: e.target.value }))}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={editDraft.description}
                maxLength={255}
                rows={3}
                onChange={(e) => setEditDraft((current) => ({ ...current, description: e.target.value }))}
              />
            </Field>
          </div>
          <DialogFooter className="sm:justify-between">
            {editRole ? (
              <Button type="button" variant="outline" onClick={() => openPermissions(editRole)}>
                Manage permissions
              </Button>
            ) : (
              <span />
            )}
            <Button disabled={editBusy} onClick={() => void saveEdit()}>
              {editBusy ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(permissionsRole)} onOpenChange={(open) => !open && setPermissionsRole(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Role permissions</DialogTitle>
            <DialogDescription>
              {permissionsRole ? (
                <>
                  Add or remove permissions for <span className="font-medium">{permissionsRole.roleName}</span> (
                  <span className="font-mono">{permissionsRole.roleCode}</span>).
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {permissionsRole ? (
            <div className="grid gap-2">
              {permissions.length ? (
                permissions.map((permission) => {
                  const granted = permissionsRole.permissionCodes.includes(permission.permissionCode)
                  const busy = permissionBusyKey === `${permissionsRole.id}:${permission.id}`
                  return (
                    <PermissionRow
                      key={permission.id}
                      permission={permission}
                      granted={granted}
                      busy={busy}
                      onGrant={() => void setRolePermission(permissionsRole, permission, true)}
                      onRevoke={() => void setRolePermission(permissionsRole, permission, false)}
                    />
                  )
                })
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No permissions are registered for this application yet.
                </p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsRole(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function roleHasPermission(role: ApplicationRole, permission: ApplicationPermission) {
  return role.permissionCodes.includes(permission.permissionCode)
}

function PermissionRow({
  permission,
  granted,
  busy,
  onGrant,
  onRevoke,
  compact,
}: {
  permission: ApplicationPermission
  granted: boolean
  busy: boolean
  onGrant: () => void
  onRevoke: () => void
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5',
        granted && 'border-accent/30 bg-accent/5',
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', granted ? 'font-medium' : 'text-muted-foreground')}>{permission.name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{permission.permissionCode}</p>
      </div>
      {granted ? (
        <Badge variant="outline" className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          Granted
        </Badge>
      ) : null}
      {granted ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={onRevoke}>
          {busy ? 'Removing…' : compact ? 'Remove' : 'Remove permission'}
        </Button>
      ) : (
        <Button size="sm" disabled={busy} onClick={onGrant}>
          {busy ? 'Adding…' : compact ? 'Add' : 'Add permission'}
        </Button>
      )}
    </div>
  )
}

function RoleAccordion({
  role,
  permissions,
  permissionByCode,
  defaultOpen,
  permissionBusyKey,
  onEdit,
  onManagePermissions,
  onSetPermission,
}: {
  role: ApplicationRole
  permissions: ApplicationPermission[]
  permissionByCode: Record<string, ApplicationPermission>
  defaultOpen?: boolean
  permissionBusyKey: string | null
  onEdit: () => void
  onManagePermissions: () => void
  onSetPermission: (permission: ApplicationPermission, grant: boolean) => void
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden shrink-0 sm:inline-flex"
            onClick={(event) => {
              event.preventDefault()
              onManagePermissions()
            }}
          >
            Permissions
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0"
            onClick={(event) => {
              event.preventDefault()
              onEdit()
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>

      <div className="border-t border-border px-4 py-4" onClick={(event) => event.stopPropagation()}>
        {role.description ? <p className="mb-3 text-sm text-muted-foreground">{role.description}</p> : null}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Toggle permissions for this role.</p>
          <Button type="button" size="sm" variant="outline" className="sm:hidden" onClick={onManagePermissions}>
            Manage permissions
          </Button>
        </div>

        {permissions.length ? (
          <ul className="grid gap-2">
            {permissions.map((permission) => {
              const on = roleHasPermission(role, permission)
              const busy = permissionBusyKey === `${role.id}:${permission.id}`
              return (
                <li key={permission.id}>
                  <PermissionRow
                    permission={permission}
                    granted={on}
                    busy={busy}
                    compact
                    onGrant={() => onSetPermission(permission, true)}
                    onRevoke={() => onSetPermission(permission, false)}
                  />
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

function PermissionAccordion({
  permission,
  defaultOpen,
}: {
  permission: ApplicationPermission
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <details
      className="group rounded-xl border border-border bg-background/70 open:bg-background"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <KeyRound className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{permission.name}</span>
          <span className="block font-mono text-[11px] text-muted-foreground">{permission.permissionCode}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="border-t border-border px-4 py-4">
        {permission.description ? (
          <p className="text-sm text-muted-foreground">{permission.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description provided for this permission.</p>
        )}
      </div>
    </details>
  )
}
