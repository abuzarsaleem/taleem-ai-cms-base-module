import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApplicationIcon } from '@/components/application-icon'
import { PageHeader } from '@/components/page-header'
import { PasswordInput } from '@/components/password-input'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Field, FieldGrid } from '@/components/field'
import { errorMessage } from '@/lib/auth'
import { invitationAcceptUrl, invitationIsPending } from '@/lib/invitation'
import {
  emptyTenantAdminDraft,
  generatePassword,
  isAdminPortalApplication,
  tenantAdminFieldErrors,
  tenantAdminPayload,
  type TenantAdminDraft,
} from '@/lib/tenant-admin'
import {
  ApplicationStatus,
  InvitationStatus,
  MembershipStatus,
  type AdminInvitation,
  type ApplicationRole,
  type CatalogApplication,
  type PlatformTenantAdmin,
  type Tenant,
} from '@/lib/types'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { cn, initialsFromName } from '@/lib/utils'
import {
  applicationRoleService,
  applicationService,
  entitlementService,
  invitationService,
  membershipService,
  platformAdminInvitationService,
  platformTenantAdminService,
} from '@/services/platform'

type DisplayStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE'

type UserListRow =
  | { kind: 'admin'; key: string; admin: PlatformTenantAdmin }
  | { kind: 'invitation'; key: string; invitation: AdminInvitation }

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function displayStatusForAdmin(status: string): DisplayStatus {
  if (status === MembershipStatus.ACTIVE) return 'ACTIVE'
  return 'INACTIVE'
}

export function UsersManagementPage() {
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<UserListRow[]>([])
  const [total, setTotal] = useState(0)
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('ALL')
  const [applicationFilter, setApplicationFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | DisplayStatus>('ALL')

  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<TenantAdminDraft>(emptyTenantAdminDraft())
  const [errors, setErrors] = useState<ReturnType<typeof tenantAdminFieldErrors>>({})
  const [busy, setBusy] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [entitledApps, setEntitledApps] = useState<CatalogApplication[]>([])
  const [rolesByApp, setRolesByApp] = useState<Record<string, ApplicationRole[]>>({})
  const [issuedInvite, setIssuedInvite] = useState<{ email: string; token: string } | null>(null)

  const tenantById = useMemo(
    () => Object.fromEntries(tenants.map((tenant) => [tenant.id, tenant])),
    [tenants],
  )

  const appById = useMemo(
    () => Object.fromEntries(applications.map((app) => [app.id, app])),
    [applications],
  )

  const adminPortalApps = useMemo(
    () => applications.filter((app) => app.status === ApplicationStatus.ACTIVE && isAdminPortalApplication(app)),
    [applications],
  )

  const selectableApps = useMemo(() => {
    if (!draft.tenantId) return []
    return entitledApps
  }, [draft.tenantId, entitledApps])

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, tenantFilter, applicationFilter, statusFilter])

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true)

      const tenantId = tenantFilter === 'ALL' ? undefined : tenantFilter
      const applicationId = applicationFilter === 'ALL' ? undefined : applicationFilter

      const loadAdmins =
        statusFilter !== 'PENDING'
          ? platformTenantAdminService.list({
              page,
              limit: pageSize,
              tenantId,
              applicationId,
              status:
                statusFilter === 'ACTIVE'
                  ? MembershipStatus.ACTIVE
                  : statusFilter === 'INACTIVE'
                    ? MembershipStatus.INACTIVE
                    : undefined,
              search: search || undefined,
            })
          : Promise.resolve(null)

      const loadInvites =
        statusFilter === 'PENDING' || statusFilter === 'ALL'
          ? platformAdminInvitationService.list({
              page: statusFilter === 'PENDING' ? page : 1,
              limit: statusFilter === 'PENDING' ? pageSize : 50,
              tenantId,
              status: InvitationStatus.PENDING,
              email: search || undefined,
            })
          : Promise.resolve(null)

      return Promise.all([loadAdmins, loadInvites, applicationService.list(1, 100)])
        .then(([adminResult, inviteResult, appResult]) => {
          setApplications(appResult.data)

          const inviteRows: UserListRow[] = (inviteResult?.data ?? [])
            .filter((row) => invitationIsPending(row))
            .filter((row) => {
              if (!search) return true
              const q = search.toLowerCase()
              const tenant = tenantById[row.tenantId]
              return (
                row.email.toLowerCase().includes(q) ||
                (tenant?.displayName ?? '').toLowerCase().includes(q) ||
                (tenant?.tenantCode ?? '').toLowerCase().includes(q)
              )
            })
            .map((invitation) => ({
              kind: 'invitation' as const,
              key: `invite-${invitation.id}`,
              invitation,
            }))

          if (statusFilter === 'PENDING') {
            setRows(inviteRows)
            setTotal(inviteResult?.meta.total ?? inviteRows.length)
            return
          }

          const adminRows: UserListRow[] = (adminResult?.data ?? []).map((admin) => ({
            kind: 'admin' as const,
            key: `admin-${admin.id}`,
            admin,
          }))

          if (statusFilter === 'ALL' && page === 1) {
            setRows([...inviteRows, ...adminRows])
            setTotal((adminResult?.meta.total ?? 0) + (inviteResult?.meta.total ?? 0))
          } else {
            setRows(adminRows)
            setTotal(adminResult?.meta.total ?? 0)
          }
        })
        .catch((error) => toast.error(errorMessage(error)))
        .finally(() => {
          if (!silent) setLoading(false)
        })
    },
    [page, pageSize, search, tenantFilter, applicationFilter, statusFilter, tenantById],
  )

  useEffect(() => {
    if (tenantsLoading) return
    void load()
  }, [load, tenantsLoading])

  useEffect(() => {
    if (!draft.tenantId || !createOpen) {
      setEntitledApps([])
      return
    }
    let cancelled = false
    entitlementService
      .list(draft.tenantId, 1, 100)
      .then((result) => {
        if (cancelled) return
        const active = result.data.filter((row) => row.status === 'ACTIVE' && row.applicationId)
        const catalogById = Object.fromEntries(applications.map((app) => [app.id, app]))
        const catalogByCode = Object.fromEntries(applications.map((app) => [app.applicationCode, app]))
        const next: CatalogApplication[] = []
        const seen = new Set<string>()
        for (const row of active) {
          const id = row.applicationId as string
          if (seen.has(id)) continue
          seen.add(id)
          const fromCatalog = catalogById[id] ?? (row.applicationCode ? catalogByCode[row.applicationCode] : undefined)
          next.push(
            fromCatalog ?? {
              id,
              applicationCode: row.applicationCode ?? id.slice(0, 8),
              name: row.applicationName ?? row.applicationCode ?? 'Application',
              status: ApplicationStatus.ACTIVE,
              launchUrl: row.launchUrl,
            },
          )
        }
        setEntitledApps(next)
      })
      .catch(() => {
        if (!cancelled) setEntitledApps([])
      })
    return () => {
      cancelled = true
    }
  }, [draft.tenantId, createOpen, applications])

  async function ensureRoles(applicationId: string) {
    if (rolesByApp[applicationId]) return rolesByApp[applicationId]
    try {
      const roles = await applicationRoleService.list(applicationId)
      setRolesByApp((current) => ({ ...current, [applicationId]: roles }))
      return roles
    } catch (error) {
      toast.error(errorMessage(error))
      return []
    }
  }

  const hasFilters =
    Boolean(search) || tenantFilter !== 'ALL' || applicationFilter !== 'ALL' || statusFilter !== 'ALL'

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setTenantFilter('ALL')
    setApplicationFilter('ALL')
    setStatusFilter('ALL')
    setPage(1)
  }

  function openCreate() {
    setDraft(emptyTenantAdminDraft())
    setErrors({})
    setIssuedInvite(null)
    setCreateOpen(true)
  }

  function patchDraft(partial: Partial<TenantAdminDraft>) {
    setDraft((current) => {
      const next = { ...current, ...partial }
      if (Object.keys(errors).length) setErrors(tenantAdminFieldErrors(next))
      return next
    })
  }

  async function toggleApplication(app: CatalogApplication, checked: boolean) {
    if (!checked) {
      patchDraft({
        applications: draft.applications.filter((item) => item.applicationId !== app.id),
      })
      return
    }
    const roles = await ensureRoles(app.id)
    const preferred =
      roles.find((role) => role.roleCode.toUpperCase().includes('ADMIN')) ?? roles[0]
    patchDraft({
      applications: [
        ...draft.applications,
        { applicationId: app.id, roleId: preferred?.id ?? '' },
      ],
    })
  }

  async function saveCreate() {
    const nextErrors = tenantAdminFieldErrors(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    try {
      const result = await platformTenantAdminService.provision(draft.tenantId, tenantAdminPayload(draft))
      if (result.status === 'INVITED' && result.invitation?.invitationToken) {
        setIssuedInvite({
          email: result.invitation.email,
          token: result.invitation.invitationToken,
        })
        toast.success('Invitation sent')
      } else {
        toast.success('Tenant administrator created')
        setCreateOpen(false)
      }
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function setMembershipStatus(admin: PlatformTenantAdmin, status: MembershipStatus) {
    setActionId(admin.id)
    try {
      await membershipService.update(admin.tenantId, admin.id, { status })
      toast.success(status === MembershipStatus.ACTIVE ? 'User activated' : 'User set inactive')
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function resendInvite(invitation: AdminInvitation) {
    setActionId(invitation.id)
    try {
      const next = await invitationService.resend(invitation.tenantId, invitation.id)
      if (next.invitationToken) {
        setIssuedInvite({ email: next.email, token: next.invitationToken })
        setCreateOpen(true)
      }
      toast.success('Invitation resent')
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function cancelInvite(invitation: AdminInvitation) {
    setActionId(invitation.id)
    try {
      await invitationService.cancel(invitation.tenantId, invitation.id)
      toast.success('Invitation cancelled')
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function copyInviteLink(token: string) {
    try {
      await navigator.clipboard.writeText(invitationAcceptUrl(token))
      toast.success('Invite link copied')
    } catch {
      toast.error('Could not copy invite link')
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Users Management"
        description="Manage tenant administrator users and their application access."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[16rem]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-border bg-background pl-8"
            placeholder="Search by name, email, tenant, or application..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <SearchableSelect
          value={tenantFilter}
          onValueChange={setTenantFilter}
          className="w-full sm:w-44"
          options={[
            { value: 'ALL', label: 'All tenants' },
            ...tenants.map((tenant) => ({
              value: tenant.id,
              label: tenant.displayName,
              description: tenant.tenantCode,
            })),
          ]}
          placeholder="Tenant"
        />
        <SearchableSelect
          value={applicationFilter}
          onValueChange={setApplicationFilter}
          className="w-full sm:w-44"
          options={[
            { value: 'ALL', label: 'All applications' },
            ...adminPortalApps.map((app) => ({
              value: app.id,
              label: app.name,
              description: app.applicationCode,
            })),
          ]}
          placeholder="Application"
        />
        <SearchableSelect
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as 'ALL' | DisplayStatus)}
          className="w-full sm:w-36"
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
          placeholder="Status"
        />
        {hasFilters ? (
          <Button type="button" variant="ghost" className="shrink-0 text-primary" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="shrink-0 sm:ml-auto" disabled>
          <Download className="size-4" />
          Export
        </Button>
        <Button type="button" className="shrink-0" onClick={openCreate}>
          <Plus className="size-4" />
          Create / Invite tenant admin
        </Button>
      </div>

      {loading || tenantsLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Entitled Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                if (row.kind === 'invitation') {
                  const invitation = row.invitation
                  const tenant = tenantById[invitation.tenantId]
                  return (
                    <TableRow key={row.key} className="border-border">
                      <TableCell className="tabular-nums text-muted-foreground">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <UserCell name={invitation.email.split('@')[0] ?? invitation.email} />
                      </TableCell>
                      <TableCell className="text-foreground/80">{invitation.email}</TableCell>
                      <TableCell>
                        <TenantCell tenant={tenant} tenantId={invitation.tenantId} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                      <TableCell>
                        <StatusBadge value="PENDING" />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-foreground/80">
                        {formatDate(invitation.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              loading={actionId === invitation.id}
                              aria-label="Invitation actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => void resendInvite(invitation)}>
                              Resend invitation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => void cancelInvite(invitation)}>
                              Cancel invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                }

                const admin = row.admin
                const apps = admin.applications ?? []
                return (
                  <TableRow key={row.key} className="border-border">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <UserCell name={admin.userFullName || admin.userEmail} />
                    </TableCell>
                    <TableCell className="text-foreground/80">{admin.userEmail}</TableCell>
                    <TableCell>
                      <TenantCell
                        tenant={{
                          id: admin.tenantId,
                          tenantCode: admin.tenantCode,
                          displayName: admin.tenantDisplayName,
                        }}
                        tenantId={admin.tenantId}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {apps.slice(0, 2).map((item) => {
                          const app = appById[item.applicationId]
                          return (
                            <ApplicationIcon
                              key={`${admin.id}-${item.applicationId}`}
                              code={item.applicationCode}
                              logoUrl={app?.logoUrl}
                              size="sm"
                              className="size-7 rounded-lg"
                            />
                          )
                        })}
                        {apps.length > 2 ? (
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground">
                            +{apps.length - 2}
                          </span>
                        ) : null}
                        {!apps.length ? <span className="text-muted-foreground">—</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={displayStatusForAdmin(String(admin.status))} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-foreground/80">
                      {formatDate(admin.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon-sm" variant="ghost" loading={actionId === admin.id} aria-label={`Actions for ${admin.userEmail}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {displayStatusForAdmin(String(admin.status)) === 'ACTIVE' ? (
                            <DropdownMenuItem
                              onClick={() => void setMembershipStatus(admin, MembershipStatus.INACTIVE)}
                            >
                              Set inactive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => void setMembershipStatus(admin, MembershipStatus.ACTIVE)}
                            >
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!rows.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No tenant administrators match these filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
      />

      <Sheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setIssuedInvite(null)
        }}
      >
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Create / Invite tenant admin</SheetTitle>
            <SheetDescription>
              Create a new user or send an invitation and assign application access.
            </SheetDescription>
          </SheetHeader>

          {issuedInvite ? (
            <div className="space-y-4 p-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm">
                Invitation created for <span className="font-medium">{issuedInvite.email}</span>. Share the accept
                link so they can set a password.
              </div>
              <Field label="Accept link">
                <div className="flex gap-2">
                  <Input readOnly value={invitationAcceptUrl(issuedInvite.token)} className="font-mono text-xs" />
                  <Button type="button" variant="outline" onClick={() => void copyInviteLink(issuedInvite.token)}>
                    Copy
                  </Button>
                </div>
              </Field>
              <SheetFooter className="border-0 px-0">
                <Button type="button" onClick={() => setCreateOpen(false)}>
                  Done
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <>
              <div className="space-y-5 p-4">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      draft.mode === 'INVITE'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => patchDraft({ mode: 'INVITE', password: '' })}
                  >
                    Send invitation
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      draft.mode === 'CREATE'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => patchDraft({ mode: 'CREATE' })}
                  >
                    Create with password
                  </button>
                </div>

                <FieldGrid>
                  <Field label="Tenant" required className="sm:col-span-2" error={errors.tenantId}>
                    <SearchableSelect
                      value={draft.tenantId || '__none__'}
                      onValueChange={(tenantId) =>
                        patchDraft({
                          tenantId: tenantId === '__none__' ? '' : tenantId,
                          applications: [],
                        })
                      }
                      options={[
                        { value: '__none__', label: 'Select tenant' },
                        ...tenants.map((tenant) => ({
                          value: tenant.id,
                          label: `${tenant.displayName} (${tenant.tenantCode})`,
                          description: tenant.tenantCode,
                        })),
                      ]}
                      placeholder="Select tenant"
                    />
                  </Field>
                  <Field
                    label="Full name"
                    required={draft.mode === 'CREATE'}
                    className="sm:col-span-2"
                    error={errors.fullName}
                  >
                    <Input
                      value={draft.fullName}
                      maxLength={150}
                      autoComplete="name"
                      onChange={(event) => patchDraft({ fullName: event.target.value })}
                    />
                  </Field>
                  <Field label="Email address" required className="sm:col-span-2" error={errors.email}>
                    <Input
                      type="email"
                      value={draft.email}
                      maxLength={255}
                      autoComplete="email"
                      onChange={(event) => patchDraft({ email: event.target.value })}
                    />
                  </Field>
                  {draft.mode === 'CREATE' ? (
                    <Field label="Password" required className="sm:col-span-2" error={errors.password}>
                      <div className="flex gap-2">
                        <PasswordInput
                          value={draft.password}
                          maxLength={128}
                          autoComplete="new-password"
                          className="flex-1"
                          onChange={(event) => patchDraft({ password: event.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="shrink-0 text-primary"
                          onClick={() => patchDraft({ password: generatePassword() })}
                        >
                          Generate
                        </Button>
                      </div>
                    </Field>
                  ) : null}
                </FieldGrid>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Application access</p>
                    <p className="text-xs text-muted-foreground">
                      Assign access for applications entitled to this tenant. Pick a role for each selected app.
                    </p>
                    {errors.applications ? (
                      <p className="mt-1 text-xs text-destructive">{errors.applications}</p>
                    ) : null}
                  </div>

                  {!draft.tenantId ? (
                    <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      Select a tenant to choose admin portal applications.
                    </p>
                  ) : !selectableApps.length ? (
                    <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      No entitled applications for this tenant yet. Add them on a subscription first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectableApps.map((app) => {
                        const selected = draft.applications.find((item) => item.applicationId === app.id)
                        const roles = rolesByApp[app.id] ?? []
                        return (
                          <div
                            key={app.id}
                            className={cn(
                              'rounded-xl border px-3 py-3 transition-colors',
                              selected ? 'border-primary/40 bg-primary/5' : 'border-border',
                            )}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Checkbox
                                  checked={Boolean(selected)}
                                  onCheckedChange={(checked) => void toggleApplication(app, checked === true)}
                                />
                                <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{app.name}</p>
                                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                                    {app.applicationCode}
                                  </p>
                                </div>
                              </div>
                              {selected ? (
                                <SearchableSelect
                                  value={selected.roleId || '__none__'}
                                  onValueChange={(roleId) => {
                                    void ensureRoles(app.id)
                                    patchDraft({
                                      applications: draft.applications.map((item) =>
                                        item.applicationId === app.id
                                          ? { ...item, roleId: roleId === '__none__' ? '' : roleId }
                                          : item,
                                      ),
                                    })
                                  }}
                                  className="w-full sm:w-56"
                                  contentClassName="w-max min-w-full max-w-[min(24rem,calc(100vw-3rem))]"
                                  options={[
                                    { value: '__none__', label: 'Select role' },
                                    ...roles.map((role) => ({
                                      value: role.id,
                                      label: role.roleName,
                                      description: role.roleCode,
                                    })),
                                  ]}
                                  placeholder="Select role"
                                />
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl border border-blue-500/25 bg-blue-500/8 px-3 py-2.5 text-sm text-blue-900 dark:text-blue-100">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>Role permissions are not part of this step and can be configured later.</p>
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t border-border">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" loading={busy} onClick={() => void saveCreate()}>
                  {draft.mode === 'INVITE' ? 'Send invitation' : 'Create user'}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function UserCell({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="default" className="size-9 bg-muted">
        <AvatarFallback className="bg-[#e8eef8] text-xs font-semibold text-[#19316f] dark:bg-white/10 dark:text-white">
          {initialsFromName(name) || <Users className="size-3.5" />}
        </AvatarFallback>
      </Avatar>
      <p className="truncate font-medium text-foreground">{name}</p>
    </div>
  )
}

function TenantCell({
  tenant,
  tenantId,
}: {
  tenant?: Pick<Tenant, 'id' | 'tenantCode' | 'displayName'> | { id: string; tenantCode: string; displayName: string }
  tenantId: string
}) {
  const name = tenant?.displayName ?? 'Unknown tenant'
  const code = tenant?.tenantCode ?? tenantId.slice(0, 8)
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar size="default" className="size-8 bg-muted">
        <AvatarFallback className="bg-[#e8eef8] text-[10px] font-semibold text-[#19316f] dark:bg-white/10 dark:text-white">
          {initialsFromName(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{code}</p>
      </div>
    </div>
  )
}
