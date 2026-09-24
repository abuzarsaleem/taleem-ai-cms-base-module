import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { errorMessage } from '@/lib/auth'
import {
  TenantSetupProgressStatus,
  TenantStatus,
  type PlatformConfigurationRow,
} from '@/lib/types'
import { cn, initialsFromName } from '@/lib/utils'
import { platformConfigurationService } from '@/services/platform'

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function domainFrom(url?: string) {
  if (!url) return '—'
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
  } catch {
    return url
  }
}

function progressLabel(row: PlatformConfigurationRow) {
  const completed = row.completedCount ?? 0
  const required = row.requiredCount ?? 4
  const percent = row.percent ?? Math.round((completed / Math.max(required, 1)) * 100)
  return { completed, required, percent }
}

function progressTone(percent: number) {
  if (percent >= 100) return 'bg-emerald-500'
  if (percent > 0) return 'bg-primary'
  return 'bg-muted-foreground/30'
}

function setupBadge(status?: string) {
  if (status === TenantSetupProgressStatus.COMPLETE) return 'COMPLETE'
  if (status === TenantSetupProgressStatus.IN_PROGRESS) return 'IN_PROGRESS'
  return 'NOT_STARTED'
}

export function PlatformConfigurationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const pageSize = Number(searchParams.get('pageSize') || 10) || 10
  const statusFilter = searchParams.get('status') || 'ALL'
  const progressFilter = searchParams.get('progress') || 'ALL'
  const searchFromUrl = searchParams.get('q') || ''

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [rows, setRows] = useState<PlatformConfigurationRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => setSearchInput(searchFromUrl), [searchFromUrl])

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

  const load = useCallback(() => {
    setLoading(true)
    platformConfigurationService
      .list({
        page,
        limit: pageSize,
        search: searchFromUrl.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        progressStatus: progressFilter === 'ALL' ? undefined : progressFilter,
      })
      .then((result) => {
        setRows(result.data)
        setTotal(result.meta.total)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [page, pageSize, searchFromUrl, statusFilter, progressFilter])

  useEffect(() => {
    load()
  }, [load])

  const timezoneOptions = useMemo(() => {
    const values = rows.map((row) => row.timezone).filter(Boolean) as string[]
    return Array.from(new Set(values)).sort()
  }, [rows])

  function patchParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === 'ALL') params.delete(key)
      else params.set(key, value)
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const hasFilters = Boolean(searchFromUrl.trim()) || statusFilter !== 'ALL' || progressFilter !== 'ALL'

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Tenant configuration"
        title="Tenant Configurations"
        description="View and manage configuration settings for all tenants across the platform."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-border bg-background pl-8"
            placeholder="Search by tenant name, code, domain..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <SearchableSelect
          value={statusFilter}
          onValueChange={(value) => patchParams({ status: value })}
          className="w-full sm:w-40"
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: TenantStatus.ACTIVE, label: 'Active' },
            { value: TenantStatus.ONBOARDING, label: 'Onboarding' },
            { value: TenantStatus.SUSPENDED, label: 'Suspended' },
            { value: TenantStatus.RETIRED, label: 'Retired' },
          ]}
          placeholder="Status"
        />
        <SearchableSelect
          value={progressFilter}
          onValueChange={(value) => patchParams({ progress: value })}
          className="w-full sm:w-48"
          options={[
            { value: 'ALL', label: 'All progress' },
            { value: TenantSetupProgressStatus.NOT_STARTED, label: 'Not started' },
            { value: TenantSetupProgressStatus.IN_PROGRESS, label: 'In progress' },
            { value: TenantSetupProgressStatus.COMPLETE, label: 'Complete' },
          ]}
          placeholder="Progress"
        />
        {timezoneOptions.length ? (
          <SearchableSelect
            value="ALL"
            onValueChange={() => undefined}
            className="hidden w-full sm:flex sm:w-44"
            options={[{ value: 'ALL', label: 'All timezones' }]}
            placeholder="Timezone"
          />
        ) : null}
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
                params.delete('progress')
                params.set('page', '1')
                return params
              })
            }}
          >
            Clear filters
          </Button>
        ) : null}
        <Button asChild className="shrink-0 sm:ml-auto">
          <Link to="/platform/configuration/new">
            <Plus className="size-4" />
            Configure tenant
          </Link>
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Tenant name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Configuration progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const progress = progressLabel(row)
                const name = row.displayName || row.tenantCode || row.tenantId
                return (
                  <TableRow
                    key={row.tenantId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/platform/configuration/${row.tenantId}`)}
                  >
                    <TableCell className="text-muted-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9 bg-muted">
                          <AvatarFallback className="bg-[#e8eef8] text-xs font-semibold text-[#19316f]">
                            {initialsFromName(name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="truncate font-medium">{name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.tenantCode || '—'}</TableCell>
                    <TableCell className="text-foreground/80">{domainFrom(row.websiteUrl)}</TableCell>
                    <TableCell>
                      <div className="min-w-[9rem] space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="tabular-nums text-muted-foreground">
                            {progress.completed}/{progress.required} ({progress.percent}%)
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full transition-all', progressTone(progress.percent))}
                            style={{ width: `${Math.min(progress.percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={setupBadge(row.progressStatus)} />
                    </TableCell>
                    <TableCell className="text-foreground/80">{formatDateTime(row.updatedAt)}</TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/platform/configuration/${row.tenantId}`}>Configure</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!rows.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No tenant configurations match these filters.
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
