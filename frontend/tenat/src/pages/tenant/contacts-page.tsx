import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import type { TenantContact } from '@/lib/types'
import { tenantContactService } from '@/services/platform'
import {
  ResourceWorkspace,
  matchesFilter,
  usePlatformListQuery,
} from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantContactsPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantContactsList tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantContactsList({ tenantId }: { tenantId: string }) {
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantContact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    tenantContactService
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
    () => rows.filter((row) => matchesFilter(list.query, row.firstName, row.lastName, row.email, row.contactType)),
    [list.query, rows],
  )

  return (
    <ResourceWorkspace
      eyebrow="Institution"
      title="Contacts"
      description="Contact persons for this institution."
      addLabel="Add contact"
      addTo="/tenant/contacts/new"
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Search name or email"
      showTenantFilter={false}
      loading={loading}
      page={list.page}
      total={total}
      pageSize={list.pageSize}
      onPageChange={list.onPageChange}
      onPageSizeChange={list.onPageSizeChange}
    >
      <DataTable
        columns={['Name', 'Email', 'Type', 'Status', '']}
        empty="No contacts match this filter."
        rows={visible.map((row) => [
          `${row.firstName} ${row.lastName ?? ''}`.trim(),
          row.email ?? '—',
          labelize(row.contactType),
          <StatusBadge key={row.id} value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/tenant/contacts/${row.id}`}
            deleteTitle="Remove this contact?"
            deleteDescription="This contact will be removed from the institution."
            onDelete={() =>
              tenantContactService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Contact removed')
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
