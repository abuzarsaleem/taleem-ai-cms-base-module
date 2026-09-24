import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Pencil,
  Plus,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ApplicationIcon } from '@/components/application-icon'
import { Field } from '@/components/field'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { ApplicationPermission, ApplicationRole, CatalogApplication } from '@/lib/types'
import { applicationAccessService, applicationRoleService } from '@/services/platform'

type View = 'list' | 'create' | 'edit' | 'permissions'

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

export function ApplicationRolesDrawer({
  open,
  onOpenChange,
  application,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: CatalogApplication | null
}) {
  const applicationId = application?.id ?? ''
  const [view, setView] = useState<View>('list')
  const [roles, setRoles] = useState<ApplicationRole[]>([])
  const [permissions, setPermissions] = useState<ApplicationPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [createDraft, setCreateDraft] = useState(emptyCreateDraft)
  const [createErrors, setCreateErrors] = useState<{ roleCode?: string; roleName?: string }>({})
  const [createBusy, setCreateBusy] = useState(false)
  const [editRole, setEditRole] = useState<ApplicationRole | null>(null)
  const [editDraft, setEditDraft] = useState<EditRoleDraft>({ roleName: '', description: '' })
  const [editErrors, setEditErrors] = useState<{ roleName?: string }>({})
  const [editBusy, setEditBusy] = useState(false)
  const [permissionsRole, setPermissionsRole] = useState<ApplicationRole | null>(null)
  const [permissionBusyKey, setPermissionBusyKey] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!applicationId) return
    const [nextRoles, nextPermissions] = await Promise.all([
      applicationRoleService.list(applicationId),
      applicationAccessService.permissions(applicationId),
    ])
    setRoles(nextRoles)
    setPermissions(nextPermissions)
  }, [applicationId])

  useEffect(() => {
    if (!open || !applicationId) return
    let cancelled = false
    setLoading(true)
    setView('list')
    setCreateDraft(emptyCreateDraft())
    setEditRole(null)
    setPermissionsRole(null)
    reload()
      .catch((error) => {
        if (!cancelled) toast.error(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, applicationId, reload])

  function syncRole(updated: ApplicationRole) {
    setRoles((current) => current.map((row) => (row.id === updated.id ? updated : row)))
    setPermissionsRole((current) => (current?.id === updated.id ? updated : current))
    setEditRole((current) => (current?.id === updated.id ? updated : current))
  }

  async function createRole() {
    const roleCode = createDraft.roleCode.trim()
    const roleName = createDraft.roleName.trim()
    const nextErrors: { roleCode?: string; roleName?: string } = {}
    if (!roleCode) nextErrors.roleCode = 'Role code is required'
    else if (roleCode.length > 50) nextErrors.roleCode = 'Role code must be 50 characters or fewer'
    if (!roleName) nextErrors.roleName = 'Role name is required'
    else if (roleName.length > 100) nextErrors.roleName = 'Role name must be 100 characters or fewer'
    if (createDraft.description.length > 255) {
      toast.error('Description must be 255 characters or fewer')
      return
    }
    setCreateErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setCreateBusy(true)
    try {
      const created = await applicationRoleService.create(applicationId, {
        roleCode: roleCode.toUpperCase(),
        roleName,
        description: createDraft.description.trim() || undefined,
        permissionIds: createDraft.permissionIds.length ? createDraft.permissionIds : undefined,
      })
      setRoles((current) => [...current, created])
      setCreateDraft(emptyCreateDraft())
      setCreateErrors({})
      setView('list')
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
    setEditErrors({})
    setView('edit')
  }

  async function saveEdit() {
    if (!editRole) return
    const roleName = editDraft.roleName.trim()
    const nextErrors: { roleName?: string } = {}
    if (!roleName) nextErrors.roleName = 'Role name is required'
    else if (roleName.length > 100) nextErrors.roleName = 'Role name must be 100 characters or fewer'
    if (editDraft.description.length > 255) {
      toast.error('Description must be 255 characters or fewer')
      return
    }
    setEditErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setEditBusy(true)
    try {
      const updated = await applicationRoleService.update(applicationId, editRole.id, {
        roleName,
        description: editDraft.description.trim() || undefined,
      })
      syncRole(updated)
      setView('list')
      setEditRole(null)
      setEditErrors({})
      toast.success('Role updated')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setEditBusy(false)
    }
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
    setView('permissions')
  }

  function backToList() {
    setView('list')
    setEditRole(null)
    setPermissionsRole(null)
    setCreateDraft(emptyCreateDraft())
  }

  const title = useMemo(() => {
    if (view === 'create') return 'Create role'
    if (view === 'edit') return 'Edit role'
    if (view === 'permissions') return 'Role permissions'
    return 'Roles & permissions'
  }, [view])

  const description = useMemo(() => {
    if (!application) return ''
    if (view === 'create') {
      return `Add a system role for ${application.name}. Role code is stored uppercase and cannot be changed later.`
    }
    if (view === 'edit' && editRole) {
      return `Update ${editRole.roleCode}. Manage permissions separately.`
    }
    if (view === 'permissions' && permissionsRole) {
      return `Add or remove permissions for ${permissionsRole.roleName}.`
    }
    return `Manage system roles for ${application.name}. Tenant admins assign these when granting access.`
  }, [application, view, editRole, permissionsRole])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
        <SheetHeader className="border-b border-border pr-12">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {view === 'create' ? (
                <Plus className="size-4" />
              ) : view === 'edit' ? (
                <Pencil className="size-4" />
              ) : view === 'permissions' ? (
                <KeyRound className="size-4" />
              ) : (
                <Shield className="size-4" />
              )}
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
          </div>
          {application && view === 'list' ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
              <ApplicationIcon code={application.applicationCode} logoUrl={application.logoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{application.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{application.applicationCode}</p>
              </div>
              <StatusBadge value={application.status} />
            </div>
          ) : null}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : view === 'list' ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {roles.length} role{roles.length === 1 ? '' : 's'} · {permissions.length} permission
                  {permissions.length === 1 ? '' : 's'}
                </p>
                <Button size="sm" onClick={() => setView('create')}>
                  <Plus className="size-3.5" />
                  Create role
                </Button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {roles.length ? (
                  roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-xl border border-border/80 bg-background/70 px-3 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/12 text-teal-700 dark:text-teal-300">
                          <Shield className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{role.roleName}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{role.roleCode}</p>
                          {role.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{role.description}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="outline">{role.roleType}</Badge>
                            <Badge variant="secondary">
                              {role.permissionCodes.length} permission
                              {role.permissionCodes.length === 1 ? '' : 's'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/70 pt-3">
                        <Button size="sm" variant="outline" onClick={() => openPermissions(role)}>
                          <KeyRound className="size-3.5" />
                          Permissions
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(role)}>
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">No roles yet for this application.</p>
                    <Button className="mt-4" size="sm" onClick={() => setView('create')}>
                      <Plus className="size-3.5" />
                      Create first role
                    </Button>
                  </div>
                )}

                {permissions.length ? (
                  <div className="pt-2">
                    <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Available permissions
                    </p>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="rounded-xl border border-border/70 bg-muted/10 px-3 py-2.5"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <KeyRound className="size-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{permission.name}</p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {permission.permissionCode}
                              </p>
                              {permission.description ? (
                                <p className="mt-1 text-xs text-muted-foreground">{permission.description}</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : view === 'create' ? (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <Field label="Role code" required error={createErrors.roleCode}>
                  <Input
                    value={createDraft.roleCode}
                    maxLength={50}
                    placeholder="ALUMNI_MEMBER"
                    onChange={(e) => {
                      setCreateDraft((current) => ({
                        ...current,
                        roleCode: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                      }))
                      setCreateErrors((current) => ({ ...current, roleCode: undefined }))
                    }}
                  />
                </Field>
                <Field label="Role name" required error={createErrors.roleName}>
                  <Input
                    value={createDraft.roleName}
                    maxLength={100}
                    placeholder="Alumni member"
                    onChange={(e) => {
                      setCreateDraft((current) => ({ ...current, roleName: e.target.value }))
                      setCreateErrors((current) => ({ ...current, roleName: undefined }))
                    }}
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
                  <Field
                    label="Permissions"
                    hint="Optional. You can also attach permissions after creating the role."
                  >
                    <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
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
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {permission.permissionCode}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </Field>
                ) : null}
              </div>
              <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border sm:flex-row">
                <Button type="button" variant="outline" disabled={createBusy} onClick={backToList}>
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>
                <Button disabled={createBusy} onClick={() => void createRole()}>
                  {createBusy ? 'Creating…' : 'Create role'}
                  {!createBusy ? <ArrowRight className="size-4" /> : null}
                </Button>
              </SheetFooter>
            </>
          ) : view === 'edit' ? (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <Field label="Role name" required error={editErrors.roleName}>
                  <Input
                    value={editDraft.roleName}
                    maxLength={100}
                    onChange={(e) => {
                      setEditDraft((current) => ({ ...current, roleName: e.target.value }))
                      setEditErrors((current) => ({ ...current, roleName: undefined }))
                    }}
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
              <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t border-border sm:flex-row">
                <Button type="button" variant="outline" disabled={editBusy} onClick={backToList}>
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>
                <div className="flex gap-2">
                  {editRole ? (
                    <Button type="button" variant="outline" onClick={() => openPermissions(editRole)}>
                      Permissions
                    </Button>
                  ) : null}
                  <Button disabled={editBusy} onClick={() => void saveEdit()}>
                    {editBusy ? 'Saving…' : 'Save changes'}
                    {!editBusy ? <ArrowRight className="size-4" /> : null}
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {permissionsRole && permissions.length ? (
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
              <SheetFooter className="border-t border-border">
                <Button variant="outline" onClick={backToList}>
                  <ArrowLeft className="size-3.5" />
                  Back to roles
                </Button>
              </SheetFooter>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PermissionRow({
  permission,
  granted,
  busy,
  onGrant,
  onRevoke,
}: {
  permission: ApplicationPermission
  granted: boolean
  busy: boolean
  onGrant: () => void
  onRevoke: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5',
        granted && 'border-emerald-500/25 bg-emerald-500/5',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', granted ? 'font-medium' : 'text-muted-foreground')}>{permission.name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{permission.permissionCode}</p>
      </div>
      {granted ? (
        <Badge
          variant="outline"
          className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        >
          Granted
        </Badge>
      ) : null}
      {granted ? (
        <Button size="sm" variant="outline" loading={busy} onClick={onRevoke}>Remove</Button>
      ) : (
        <Button size="sm" loading={busy} onClick={onGrant}>Add</Button>
      )}
    </div>
  )
}
