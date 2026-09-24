import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Download,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApplicationIcon } from '@/components/application-icon'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { SubscriptionFields } from '@/components/subscription-fields'
import { TablePagination } from '@/components/table-pagination'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { errorMessage } from '@/lib/auth'
import {
  emptySubscriptionDraft,
  subscriptionDisplayStatus,
  subscriptionDurationLabel,
  subscriptionFieldErrors,
  subscriptionPeriodEnded,
  type SubscriptionDraft,
} from '@/lib/subscription'
import {
  ApplicationStatus,
  BillingCycle,
  PlanType,
  SubscriptionStatus,
  type CatalogApplication,
  type Entitlement,
  type Subscription,
  type Tenant,
} from '@/lib/types'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { cn, initialsFromName, labelize } from '@/lib/utils'
import {
  applicationService,
  entitlementService,
  platformEntitlementService,
  platformSubscriptionService,
  subscriptionService,
} from '@/services/platform'

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function billingLabel(cycle?: BillingCycle) {
  if (!cycle) return '—'
  if (cycle === BillingCycle.YEARLY) return 'Annual'
  return labelize(cycle)
}

function planTone(plan: PlanType) {
  if (plan === PlanType.PAID) return plan
  if (plan === PlanType.TRIAL) return plan
  return plan
}

type DisplayStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'

export function SubscriptionsPage() {
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | DisplayStatus>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | PlanType>('ALL')
  const [billingFilter, setBillingFilter] = useState<'ALL' | BillingCycle>('ALL')

  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Subscription | null>(null)
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [entitlementsLoading, setEntitlementsLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<SubscriptionDraft>(emptySubscriptionDraft())
  const [errors, setErrors] = useState<ReturnType<typeof subscriptionFieldErrors>>({})
  const [busy, setBusy] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [addingApp, setAddingApp] = useState(false)

  const tenantById = useMemo(
    () => Object.fromEntries(tenants.map((tenant) => [tenant.id, tenant])),
    [tenants],
  )

  const appByCode = useMemo(
    () => Object.fromEntries(applications.map((app) => [app.applicationCode, app])),
    [applications],
  )

  const tenantOptions = useMemo(
    () =>
      tenants.map((tenant) => ({
        value: tenant.id,
        label: tenant.displayName,
        description: tenant.tenantCode,
      })),
    [tenants],
  )

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter, billingFilter])

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true)

      const matchedTenants = search
        ? tenants.filter((tenant) => {
            const q = search.toLowerCase()
            return (
              tenant.displayName.toLowerCase().includes(q) ||
              tenant.legalName.toLowerCase().includes(q) ||
              tenant.tenantCode.toLowerCase().includes(q) ||
              (tenant.websiteUrl ?? '').toLowerCase().includes(q)
            )
          })
        : []

      const singleTenantId = matchedTenants.length === 1 ? matchedTenants[0].id : undefined
      const apiStatus =
        statusFilter === 'ACTIVE'
          ? SubscriptionStatus.ACTIVE
          : statusFilter === 'SUSPENDED' || statusFilter === 'EXPIRED'
            ? SubscriptionStatus.INACTIVE
            : undefined

      return Promise.all([
        platformSubscriptionService.list({
          page,
          limit: pageSize,
          tenantId: singleTenantId,
          status: apiStatus,
          planType: typeFilter === 'ALL' ? undefined : typeFilter,
          billingCycle: billingFilter === 'ALL' ? undefined : billingFilter,
          subscriptionCode: search && !singleTenantId ? search : undefined,
        }),
        applicationService.list(1, 100),
      ])
        .then(([subscriptionResult, appResult]) => {
          let data = subscriptionResult.data
          if (search && !singleTenantId && matchedTenants.length > 1) {
            const ids = new Set(matchedTenants.map((tenant) => tenant.id))
            data = data.filter(
              (row) =>
                ids.has(row.tenantId) ||
                row.subscriptionCode.toLowerCase().includes(search.toLowerCase()),
            )
          }
          if (statusFilter === 'EXPIRED') {
            data = data.filter((row) => subscriptionPeriodEnded(row.endDate))
          } else if (statusFilter === 'SUSPENDED') {
            data = data.filter((row) => !subscriptionPeriodEnded(row.endDate))
          } else if (statusFilter === 'ACTIVE') {
            data = data.filter((row) => !subscriptionPeriodEnded(row.endDate))
          }
          setRows(data)
          setTotal(
            statusFilter === 'EXPIRED' || statusFilter === 'SUSPENDED' || (search && matchedTenants.length > 1)
              ? data.length
              : subscriptionResult.meta.total,
          )
          setApplications(appResult.data)
        })
        .catch((error) => toast.error(errorMessage(error)))
        .finally(() => {
          if (!silent) setLoading(false)
        })
    },
    [page, pageSize, search, statusFilter, typeFilter, billingFilter, tenants],
  )

  useEffect(() => {
    if (tenantsLoading) return
    void load()
  }, [load, tenantsLoading])

  const hasFilters =
    Boolean(search) || statusFilter !== 'ALL' || typeFilter !== 'ALL' || billingFilter !== 'ALL'

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setBillingFilter('ALL')
    setPage(1)
  }

  async function openDetail(row: Subscription) {
    setSelected(row)
    setDetailOpen(true)
    setEntitlementsLoading(true)
    try {
      const result = await platformEntitlementService.list({
        tenantId: row.tenantId,
        subscriptionId: row.id,
        limit: 100,
      })
      setEntitlements(result.data)
    } catch (error) {
      toast.error(errorMessage(error))
      setEntitlements([])
    } finally {
      setEntitlementsLoading(false)
    }
  }

  function openCreate() {
    setDraft(emptySubscriptionDraft())
    setErrors({})
    setCreateOpen(true)
  }

  async function saveCreate() {
    const nextErrors = subscriptionFieldErrors(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    try {
      await subscriptionService.create(draft.tenantId, draft)
      toast.success('Subscription created')
      setCreateOpen(false)
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(row: Subscription, status: SubscriptionStatus) {
    setActionId(row.id)
    try {
      await subscriptionService.update(row.tenantId, row.id, { status })
      toast.success(status === SubscriptionStatus.ACTIVE ? 'Subscription activated' : 'Subscription suspended')
      if (selected?.id === row.id) {
        const refreshed = await subscriptionService.get(row.tenantId, row.id)
        setSelected(refreshed)
      }
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function addApplicationToSubscription(applicationCode: string) {
    if (!selected) return
    const app = appByCode[applicationCode]
    setAddingApp(true)
    try {
      await entitlementService.create(selected.tenantId, {
        applicationCode,
        subscriptionId: selected.id,
        launchUrl: app?.launchUrl,
      })
      const codes = Array.from(new Set([...selected.applicationCodes, applicationCode]))
      await subscriptionService.update(selected.tenantId, selected.id, {
        applications: codes.map((code) => {
          const existing = entitlements.find((row) => row.applicationCode === code)
          return {
            applicationCode: code,
            launchUrl: existing?.launchUrl ?? (code === applicationCode ? app?.launchUrl : undefined),
            maxUsers: existing?.maxUsers ?? undefined,
          }
        }),
      })
      toast.success(`${applicationCode} added`)
      const refreshed = await subscriptionService.get(selected.tenantId, selected.id)
      setSelected(refreshed)
      const entitlementResult = await platformEntitlementService.list({
        tenantId: selected.tenantId,
        subscriptionId: selected.id,
        limit: 100,
      })
      setEntitlements(entitlementResult.data)
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setAddingApp(false)
    }
  }

  const selectedTenant = selected ? tenantById[selected.tenantId] : undefined
  const entitledCodes = new Set(entitlements.map((row) => row.applicationCode).filter(Boolean))
  const addableApps = applications.filter(
    (app) =>
      app.status === ApplicationStatus.ACTIVE &&
      !entitledCodes.has(app.applicationCode) &&
      !selected?.applicationCodes.includes(app.applicationCode),
  )

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Subscription Management"
        description="Manage tenant subscriptions, configured applications, and access details."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[16rem]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-border bg-background pl-8"
            placeholder="Search by tenant name, subscription ID, or domain..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <SearchableSelect
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as 'ALL' | DisplayStatus)}
          className="w-full sm:w-36"
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'EXPIRED', label: 'Expired' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
          placeholder="Status"
        />
        <SearchableSelect
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as 'ALL' | PlanType)}
          className="w-full sm:w-36"
          options={[
            { value: 'ALL', label: 'All types' },
            { value: PlanType.PAID, label: 'Paid' },
            { value: PlanType.TRIAL, label: 'Trial' },
            { value: PlanType.FREE, label: 'Free' },
          ]}
          placeholder="Type"
        />
        <SearchableSelect
          value={billingFilter}
          onValueChange={(value) => setBillingFilter(value as 'ALL' | BillingCycle)}
          className="w-full sm:w-40"
          options={[
            { value: 'ALL', label: 'All cycles' },
            { value: BillingCycle.MONTHLY, label: 'Monthly' },
            { value: BillingCycle.YEARLY, label: 'Annual' },
          ]}
          placeholder="Billing cycle"
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
          Add subscription
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
                <TableHead>Tenant</TableHead>
                <TableHead>Subscription ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Billing cycle</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>End date</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const tenant = tenantById[row.tenantId]
                const displayStatus = subscriptionDisplayStatus(row)
                const codes = row.applicationCodes ?? []
                const visible = codes.slice(0, 2)
                const overflow = codes.length - visible.length
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-border"
                    onClick={() => void openDetail(row)}
                  >
                    <TableCell className="tabular-nums text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <TenantCell tenant={tenant} tenantId={row.tenantId} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground/80">{row.subscriptionCode}</TableCell>
                    <TableCell>
                      <StatusBadge value={planTone(row.planType)} />
                    </TableCell>
                    <TableCell className="text-foreground/80">
                      {subscriptionDurationLabel(row.startDate, row.endDate)}
                    </TableCell>
                    <TableCell className="text-foreground/80">{billingLabel(row.billingCycle)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {visible.map((code) => {
                          const app = appByCode[code]
                          return (
                            <ApplicationIcon
                              key={code}
                              code={code}
                              logoUrl={app?.logoUrl}
                              size="sm"
                              className="size-7 rounded-lg"
                            />
                          )
                        })}
                        {overflow > 0 ? (
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground">
                            +{overflow}
                          </span>
                        ) : null}
                        {!codes.length ? <span className="text-muted-foreground">—</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={displayStatus} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-foreground/80">{formatDate(row.startDate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-foreground/80">{formatDate(row.endDate)}</TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <RowActions
                        row={row}
                        displayStatus={displayStatus}
                        loading={actionId === row.id}
                        onView={() => void openDetail(row)}
                        onActivate={() => void setStatus(row, SubscriptionStatus.ACTIVE)}
                        onSuspend={() => void setStatus(row, SubscriptionStatus.INACTIVE)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
              {!rows.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                    No subscriptions match these filters.
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

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-lg" showCloseButton>
          {selected ? (
            <>
              <SheetHeader className="border-b border-border pr-12">
                <SheetTitle>Subscription details</SheetTitle>
                <SheetDescription>Review plan, period, and entitled applications for this tenant.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 p-4">
                <div className="flex items-start justify-between gap-3">
                  <TenantCell tenant={selectedTenant} tenantId={selected.tenantId} large />
                  <StatusBadge value={subscriptionDisplayStatus(selected)} />
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <DetailItem label="Subscription ID" value={selected.subscriptionCode} mono />
                  <DetailItem label="Type" value={<StatusBadge value={selected.planType} />} />
                  <DetailItem
                    label="Duration"
                    value={subscriptionDurationLabel(selected.startDate, selected.endDate)}
                  />
                  <DetailItem label="Billing cycle" value={billingLabel(selected.billingCycle)} />
                  <DetailItem label="Start date" value={formatDate(selected.startDate)} />
                  <DetailItem label="End date" value={formatDate(selected.endDate)} />
                </dl>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      Entitled applications ({entitlements.length || selected.applicationCodes.length})
                    </h3>
                    {addableApps.length ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="sm" variant="outline" loading={addingApp}>
                            <Plus className="size-3.5" />
                            Add application
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {addableApps.map((app) => (
                            <DropdownMenuItem
                              key={app.id}
                              onClick={() => void addApplicationToSubscription(app.applicationCode)}
                            >
                              <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" className="size-6" />
                              <span className="truncate">{app.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>

                  {entitlementsLoading ? (
                    <Skeleton className="h-28 rounded-xl" />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead>Application</TableHead>
                            <TableHead>Launch URL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(entitlements.length
                            ? entitlements
                            : selected.applicationCodes.map((code) => ({
                                id: code,
                                applicationCode: code,
                                applicationName: appByCode[code]?.name,
                                launchUrl: appByCode[code]?.launchUrl,
                              }))
                          ).map((item) => {
                            const code = item.applicationCode ?? ''
                            const app = appByCode[code]
                            const url = item.launchUrl || app?.launchUrl
                            return (
                              <TableRow key={item.id} className="border-border">
                                <TableCell>
                                  <div className="flex min-w-0 items-center gap-2">
                                    <ApplicationIcon code={code} logoUrl={app?.logoUrl} size="sm" className="size-7" />
                                    <span className="truncate text-sm font-medium">
                                      {item.applicationName || app?.name || code}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex min-w-0 items-center gap-2">
                                    {url ? (
                                      <>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="truncate text-xs text-primary hover:underline"
                                          onClick={(event) => event.stopPropagation()}
                                        >
                                          {url.replace(/^https?:\/\//, '')}
                                        </a>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="shrink-0 text-muted-foreground hover:text-foreground"
                                          onClick={(event) => event.stopPropagation()}
                                        >
                                          <ExternalLink className="size-3.5" />
                                        </a>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                          {!selected.applicationCodes.length && !entitlements.length ? (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                                No applications on this subscription yet.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Add subscription</SheetTitle>
            <SheetDescription>
              Choose a tenant, plan, dates, and applications. Creating a subscription entitles the selected apps.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <SubscriptionFields
              value={draft}
              errors={errors}
              applications={applications}
              showTenantPicker
              tenantOptions={tenantOptions}
              onChange={(next) => {
                setDraft(next)
                if (Object.keys(errors).length) setErrors(subscriptionFieldErrors(next))
              }}
            />
          </div>
          <SheetFooter className="border-t border-border">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" loading={busy} onClick={() => void saveCreate()}>
              Create subscription
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TenantCell({
  tenant,
  tenantId,
  large,
}: {
  tenant?: Tenant
  tenantId: string
  large?: boolean
}) {
  const name = tenant?.displayName ?? 'Unknown tenant'
  const code = tenant?.tenantCode ?? tenantId.slice(0, 8)
  return (
    <div className={cn('flex min-w-0 items-center gap-3', large && 'gap-3.5')}>
      <Avatar size="default" className={cn('bg-muted', large ? 'size-11' : 'size-9')}>
        <AvatarFallback className="bg-[#e8eef8] text-xs font-semibold text-[#19316f] dark:bg-white/10 dark:text-white">
          {initialsFromName(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={cn('truncate font-medium text-foreground', large && 'text-base')}>{name}</p>
        <p className="truncate text-xs text-muted-foreground">{code}</p>
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-sm font-medium text-foreground', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}

function RowActions({
  row,
  displayStatus,
  loading,
  onView,
  onActivate,
  onSuspend,
}: {
  row: Subscription
  displayStatus: string
  loading?: boolean
  onView: () => void
  onActivate: () => void
  onSuspend: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          loading={loading}
          aria-label={`Actions for ${row.subscriptionCode}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
        {displayStatus === 'ACTIVE' ? (
          <DropdownMenuItem onClick={onSuspend}>Suspend</DropdownMenuItem>
        ) : displayStatus === 'SUSPENDED' && !subscriptionPeriodEnded(row.endDate) ? (
          <DropdownMenuItem onClick={onActivate}>Activate</DropdownMenuItem>
        ) : null}
        {displayStatus === 'EXPIRED' ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Period ended — create a new subscription</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
