import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import type { TenantAddress } from '@/lib/types'
import { tenantAddressService } from '@/services/platform'
import {
  ResourceWorkspace,
  matchesFilter,
  usePlatformListQuery,
} from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantAddressesPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantAddressesList tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantAddressesList({ tenantId }: { tenantId: string }) {
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantAddress[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    tenantAddressService
      .list(tenantId, list.page, list.pageSize)
      .then((result) => {
        setRows(result.data)
        setTotal(result.meta.total)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [list.page, list.pageSize, tenantId])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(
    () => rows.filter((row) => matchesFilter(list.query, row.city, row.addressLine1, row.addressType)),
    [list.query, rows],
  )

  return (
    <ResourceWorkspace
      eyebrow="Institution"
      title="Addresses"
      description="Physical addresses for this institution."
      addLabel="Add address"
      addTo="/tenant/addresses/new"
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Filter city or address"
      showTenantFilter={false}
      loading={loading}
      page={list.page}
      total={total}
      pageSize={list.pageSize}
      onPageChange={list.onPageChange}
      onPageSizeChange={list.onPageSizeChange}
    >
      <DataTable
        columns={['Type', 'Address', 'City', 'Status', '']}
        empty="No addresses match this filter."
        rows={visible.map((row) => [
          labelize(row.addressType),
          row.addressLine1,
          row.city,
          <StatusBadge key={row.id} value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/tenant/addresses/${row.id}`}
            onDelete={() => {
              if (!window.confirm('Remove this address?')) return
              tenantAddressService
                .delete(tenantId, row.id)
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
