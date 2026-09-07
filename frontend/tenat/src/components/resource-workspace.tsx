import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { Field } from '@/components/field'
import { TablePagination } from '@/components/table-pagination'
import type { Tenant } from '@/lib/types'

export function ResourceWorkspace({
  eyebrow,
  title,
  description,
  addLabel,
  addTo,
  query,
  onQuery,
  queryPlaceholder = 'Search this page',
  tenantId,
  onTenantId,
  tenants,
  showTenantFilter = true,
  loading,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  addLabel: string
  addTo: string
  query: string
  onQuery: (value: string) => void
  queryPlaceholder?: string
  tenantId?: string
  onTenantId?: (value: string) => void
  tenants?: Tenant[]
  showTenantFilter?: boolean
  loading?: boolean
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        toolbar={
          <>
            <Input
              className="max-w-sm"
              placeholder={queryPlaceholder}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
            />
            {showTenantFilter && tenantId && onTenantId && tenants ? (
              <Select value={tenantId} onValueChange={onTenantId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="All tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </>
        }
        actions={
          <Button asChild>
            <Link to={addTo}>
              <Plus />
              {addLabel}
            </Link>
          </Button>
        }
      />
      {loading ? <Skeleton className="h-72 rounded-xl" /> : children}
      <TablePagination
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

export function ResourceFormLayout({
  eyebrow,
  title,
  description,
  backTo,
  backLabel,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  backTo: string
  backLabel: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Button variant="outline" asChild>
            <Link to={backTo}>
              <ArrowLeft />
              {backLabel}
            </Link>
          </Button>
        }
      />
      <div className="portal-card space-y-5 p-5 sm:p-6">{children}</div>
    </div>
  )
}

export function TenantPicker({
  tenants,
  value,
  onChange,
  disabled,
}: {
  tenants: Tenant[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Field label="Tenant" required>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select tenant" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function tenantLabel(tenants: Tenant[], tenantId: string) {
  return tenants.find((row) => row.id === tenantId)?.displayName ?? tenantId
}

export function matchesFilter(query: string, ...parts: Array<string | undefined | null>) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return parts.some((part) => (part ?? '').toLowerCase().includes(needle))
}

export function createHref(path: string, tenantId: string) {
  if (!tenantId || tenantId === 'all') return `${path}/new`
  return `${path}/new?tenantId=${encodeURIComponent(tenantId)}`
}

export function usePlatformListQuery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const pageSize = Number(searchParams.get('pageSize') || 10) || 10
  const tenantId = searchParams.get('tenantId') || 'all'
  const [query, setQuery] = useState('')

  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams)
    mutate(params)
    setSearchParams(params)
  }

  return {
    page,
    pageSize,
    tenantId,
    query,
    setQuery,
    apiTenantId: tenantId === 'all' ? undefined : tenantId,
    onTenantId: (value: string) =>
      update((params) => {
        if (value === 'all') params.delete('tenantId')
        else params.set('tenantId', value)
        params.set('page', '1')
      }),
    onPageChange: (next: number) =>
      update((params) => {
        params.set('page', String(next))
      }),
    onPageSizeChange: (next: number) =>
      update((params) => {
        params.set('pageSize', String(next))
        params.set('page', '1')
      }),
  }
}
