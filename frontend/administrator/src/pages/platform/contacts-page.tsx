import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { labelize } from '@/lib/utils'
import type { TenantContact } from '@/lib/types'
import { platformContactService, tenantContactService } from '@/services/platform'
import {
  ResourceWorkspace,
  createHref,
  tenantLabel,
  usePlatformListQuery,
} from '@/pages/platform/resource-workspace'

export function PlatformContactsPage() {
  const { tenants } = usePlatformTenants()
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantContact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    platformContactService
      .list({
        page: list.page,
        limit: list.pageSize,
        tenantId: list.apiTenantId,
        search: list.query.trim() || undefined,
      })
      .then((result) => {
        setRows(result.data)
        setTotal(result.meta.total)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [list.apiTenantId, list.page, list.pageSize, list.query])

  useEffect(() => {
    load()
  }, [load])

  return (
    <ResourceWorkspace
      eyebrow="Tenant configuration"
      title="Tenant contacts"
      description="Contact persons across every institution. Filter by tenant, then open a record to edit it."
      addLabel="Add contact"
      addTo={createHref('/platform/contacts', list.tenantId)}
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Search name"
      tenantId={list.tenantId}
      onTenantId={list.onTenantId}
      tenants={tenants}
      loading={loading}
      page={list.page}
      total={total}
      pageSize={list.pageSize}
      onPageChange={list.onPageChange}
      onPageSizeChange={list.onPageSizeChange}
    >
      <DataTable
        columns={['Tenant', 'Name', 'Email', 'Type', 'Status', '']}
        empty="No contacts match this filter."
        rows={rows.map((row) => [
          <Link key={`${row.id}-tenant`} to={`/platform/tenants/${row.tenantId}`} className="font-medium hover:underline">
            {tenantLabel(tenants, row.tenantId)}
          </Link>,
          `${row.firstName} ${row.lastName ?? ''}`.trim(),
          row.email ?? '—',
          labelize(row.contactType),
          <StatusBadge key={row.id} value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/platform/contacts/${row.tenantId}/${row.id}`}
            onDelete={() => {
              if (!window.confirm('Remove this contact?')) return
              tenantContactService
                .delete(row.tenantId, row.id)
                .then(() => {
                  toast.success('Contact removed')
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
