import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { labelize } from '@/lib/utils'
import type { TenantAddress } from '@/lib/types'
import { platformAddressService, tenantAddressService } from '@/services/platform'
import {
  ResourceWorkspace,
  createHref,
  matchesFilter,
  tenantLabel,
  usePlatformListQuery,
} from '@/pages/platform/resource-workspace'

export function PlatformAddressesPage() {
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantAddress[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    platformAddressService
      .list({
        page: list.page,
        limit: list.pageSize,
        tenantId: list.apiTenantId,
      })
      .then((result) => {
        setRows(result.data)
        setTotal(result.meta.total)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [list.apiTenantId, list.page, list.pageSize])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(
    () =>
      rows.filter((row) =>
        matchesFilter(list.query, tenantLabel(tenants, row.tenantId), row.city, row.addressLine1, row.addressType),
      ),
    [list.query, rows, tenants],
  )

  return (
    <ResourceWorkspace
      eyebrow="Tenant configuration"
      title="Tenant addresses"
      description="Physical addresses across every institution. Filter by tenant, then open a record to edit it."
      addLabel="Add address"
      addTo={createHref('/platform/addresses', list.tenantId)}
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Filter city or address"
      tenantId={list.tenantId}
      onTenantId={list.onTenantId}
      tenants={tenants}
      loading={loading || tenantsLoading}
      page={list.page}
      total={total}
      pageSize={list.pageSize}
      onPageChange={list.onPageChange}
      onPageSizeChange={list.onPageSizeChange}
    >
      <DataTable
        columns={['Tenant', 'Type', 'Address', 'City', 'Status', '']}
        empty="No addresses match this filter."
        rows={visible.map((row) => [
          <Link key={`${row.id}-tenant`} to={`/platform/tenants/${row.tenantId}`} className="font-medium hover:underline">
            {tenantLabel(tenants, row.tenantId) || '—'}
          </Link>,
          labelize(row.addressType),
          row.addressLine1,
          row.city,
          <StatusBadge key={row.id} value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/platform/addresses/${row.tenantId}/${row.id}`}
            onDelete={() => {
              if (!window.confirm('Remove this address?')) return
              tenantAddressService
                .delete(row.tenantId, row.id)
                .then(() => {
                  toast.success('Address removed')
                  load()
                })
                .catch((error) => toast.error(errorMessage(error)))
            }}
          />,
        ])}
      />
    </ResourceWorkspace>
  )
}
