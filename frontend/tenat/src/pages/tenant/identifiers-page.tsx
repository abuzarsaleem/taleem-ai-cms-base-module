import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import type { TenantIdentifier } from '@/lib/types'
import { tenantIdentifierService } from '@/services/platform'
import {
  ResourceWorkspace,
  matchesFilter,
  usePlatformListQuery,
} from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantIdentifiersPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantIdentifiersList tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantIdentifiersList({ tenantId }: { tenantId: string }) {
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantIdentifier[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    tenantIdentifierService
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
    () =>
      rows.filter((row) =>
        matchesFilter(list.query, row.identifierType, row.identifierValue, row.issuingAuthority),
      ),
    [list.query, rows],
  )

  return (
    <ResourceWorkspace
      eyebrow="Institution"
      title="Identifiers"
      description="Registration and accreditation identifiers for this institution."
      addLabel="Add identifier"
      addTo="/tenant/identifiers/new"
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Search value or type"
      showTenantFilter={false}
      loading={loading}
      page={list.page}
      total={total}
      pageSize={list.pageSize}
      onPageChange={list.onPageChange}
      onPageSizeChange={list.onPageSizeChange}
    >
      <DataTable
        columns={['Type', 'Value', 'Authority', 'Verified', '']}
        empty="No identifiers match this filter."
        rows={visible.map((row) => [
          labelize(row.identifierType),
          row.identifierValue,
          row.issuingAuthority ?? '—',
          <StatusBadge key={row.id} value={row.isVerified ? 'ACTIVE' : 'PENDING'} />,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/tenant/identifiers/${row.id}`}
            deleteTitle="Remove this identifier?"
            deleteDescription="This identifier will be removed from the institution."
            onDelete={() =>
              tenantIdentifierService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Identifier removed')
                  load()
                })
                .catch((error) => toast.error(errorMessage(error)))
            }
          />,
        ])}
      />
    </ResourceWorkspace>
  )
}
