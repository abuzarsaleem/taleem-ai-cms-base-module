import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  CircleDashed,
  PauseCircle,
  Plus,
  Search,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, FilterField } from '@/components/page-header'
import { StatMetricCard, type StatMetricTone } from '@/components/stat-metric-card'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { TenantLifecycleMenu } from '@/components/tenant-lifecycle-menu'
import { TenantLogo } from '@/components/tenant-logo'
import { errorMessage } from '@/lib/auth'
import {
  DeploymentModel,
  TenantStatus,
  type Tenant,
  type TenantCatalogueStats,
} from '@/lib/types'
import { tenantService } from '@/services/platform'

const INSTITUTION_TYPES = ['UNIVERSITY', 'COLLEGE', 'SCHOOL', 'INSTITUTE', 'ACADEMY', 'OTHER'] as const

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function labelType(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function TenantsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const pageSize = Number(searchParams.get('pageSize') || 10) || 10
  const statusFilter = (searchParams.get('status') || 'ALL') as 'ALL' | TenantStatus
  const typeFilter = searchParams.get('type') || 'ALL'
  const deploymentFilter = (searchParams.get('deployment') || 'ALL') as 'ALL' | DeploymentModel
  const searchFromUrl = searchParams.get('q') || ''

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [rows, setRows] = useState<Tenant[]>([])
  const [stats, setStats] = useState<TenantCatalogueStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSearchInput(searchFromUrl)
  }, [searchFromUrl])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchInput === searchFromUrl) return
      const params = new URLSearchParams(searchParams)
      if (searchInput.trim()) params.set('q', searchInput.trim())
      else params.delete('q')
      params.set('page', '1')
      setSearchParams(params)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchInput, searchFromUrl, searchParams, setSearchParams])

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true)
      tenantService
        .list(page, pageSize, {
          search: searchFromUrl.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          institutionType: typeFilter === 'ALL' ? undefined : typeFilter,
          deploymentModel: deploymentFilter === 'ALL' ? undefined : deploymentFilter,
        })
        .then((result) => {
          setRows(result.data)
          setTotal(result.meta.total)
          setStats(result.stats)
        })
        .catch((error) => toast.error(errorMessage(error)))
        .finally(() => {
          if (!silent) setLoading(false)
        })
    },
    [page, pageSize, searchFromUrl, statusFilter, typeFilter, deploymentFilter],
  )

  useEffect(() => {
    load()
  }, [load])

  function patchParams(patch: Record<string, string | null>, resetPage = true) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '' || value === 'ALL') params.delete(key)
      else params.set(key, value)
    }
    if (resetPage) params.set('page', '1')
    setSearchParams(params)
  }

  const hasFilters =
    Boolean(searchFromUrl.trim()) ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    deploymentFilter !== 'ALL'

  const typeOptions = useMemo(() => {
    const fromRows = rows.map((row) => row.institutionType).filter(Boolean)
    return Array.from(new Set([...INSTITUTION_TYPES, ...fromRows])).sort()
  }, [rows])

  const statCards: Array<{
    title: string
    value: number
    delta: number
    icon: typeof Building2
    tone: StatMetricTone
  }> = [
    {
      title: 'Total Tenants',
      value: stats?.total ?? total,
      delta: stats?.vsPreviousMonth.total ?? 0,
      icon: Building2,
      tone: 'blue',
    },
    {
      title: 'Active Tenants',
      value: stats?.active ?? 0,
      delta: stats?.vsPreviousMonth.active ?? 0,
      icon: CheckCircle2,
      tone: 'green',
    },
    {
      title: 'Onboarding',
      value: stats?.onboarding ?? 0,
      delta: stats?.vsPreviousMonth.onboarding ?? 0,
      icon: CircleDashed,
      tone: 'amber',
    },
    {
      title: 'Suspended',
      value: stats?.suspended ?? 0,
      delta: stats?.vsPreviousMonth.suspended ?? 0,
      icon: PauseCircle,
      tone: 'rose',
    },
    {
      title: 'Retired',
      value: stats?.retired ?? 0,
      delta: stats?.vsPreviousMonth.retired ?? 0,
      icon: UserX,
      tone: 'slate',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Tenants"
        title="Tenants"
        description="Manage institutions registered on the platform. Create, activate, suspend, or retire tenants."
        actions={
          <Button asChild>
            <Link to="/platform/tenants/new">
              <Plus className="size-4" />
              Add tenant
            </Link>
          </Button>
        }
      />

      {loading && !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
          ))}
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => (
            <StatMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              delta={card.delta}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FilterField label="Search" className="min-w-0 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 border-border bg-background pl-8"
              placeholder="Search by institution name, code, or description..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </FilterField>
        <FilterField label="Status" className="w-full sm:w-40">
          <SearchableSelect
            value={statusFilter}
            onValueChange={(value) => patchParams({ status: value })}
            className="w-full"
            options={[
              { value: 'ALL', label: 'All statuses' },
              { value: TenantStatus.ACTIVE, label: 'Active' },
              { value: TenantStatus.ONBOARDING, label: 'Onboarding' },
              { value: TenantStatus.SUSPENDED, label: 'Suspended' },
              { value: TenantStatus.RETIRED, label: 'Retired' },
            ]}
            placeholder="Status"
          />
        </FilterField>
        <FilterField label="Type" className="w-full sm:w-44">
          <SearchableSelect
            value={typeFilter}
            onValueChange={(value) => patchParams({ type: value })}
            className="w-full"
            options={[
              { value: 'ALL', label: 'All types' },
              ...typeOptions.map((type) => ({ value: type, label: labelType(type) })),
            ]}
            placeholder="Type"
          />
        </FilterField>
        <FilterField label="Deployment" className="w-full sm:w-44">
          <SearchableSelect
            value={deploymentFilter}
            onValueChange={(value) => patchParams({ deployment: value })}
            className="w-full"
            options={[
              { value: 'ALL', label: 'All models' },
              { value: DeploymentModel.SAAS, label: 'SaaS' },
              { value: DeploymentModel.ON_PREMISES, label: 'On premises' },
            ]}
            placeholder="Deployment"
          />
        </FilterField>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 text-muted-foreground"
            onClick={() => {
              setSearchInput('')
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev)
                params.delete('q')
                params.delete('status')
                params.delete('type')
                params.delete('deployment')
                params.set('page', '1')
                return params
              })
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Institution</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="cursor-pointer border-border"
                  onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <TenantLogo
                        name={tenant.displayName}
                        logoUrl={tenant.logoUrl}
                        logoDarkUrl={tenant.logoDarkUrl}
                        className="size-9 rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{tenant.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{tenant.legalName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground/80">{tenant.tenantCode}</TableCell>
                  <TableCell className="text-foreground/80">{labelType(tenant.institutionType)}</TableCell>
                  <TableCell className="tabular-nums text-foreground/80">
                    {tenant.applicationCount ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={tenant.status} />
                  </TableCell>
                  <TableCell className="text-foreground/80">{formatDate(tenant.createdAt)}</TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <TenantLifecycleMenu tenant={tenant} onChanged={() => load(true)} />
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No tenants match these filters.
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
        onPageChange={(next) => {
          const params = new URLSearchParams(searchParams)
          params.set('page', String(next))
          setSearchParams(params)
        }}
        onPageSizeChange={(next) => {
          const params = new URLSearchParams(searchParams)
          params.set('pageSize', String(next))
          params.set('page', '1')
          setSearchParams(params)
        }}
      />
    </div>
  )
}
