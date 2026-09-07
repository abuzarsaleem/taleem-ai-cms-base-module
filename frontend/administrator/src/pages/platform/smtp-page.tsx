import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { labelize } from '@/lib/utils'
import type { TenantSmtp } from '@/lib/types'
import { platformSmtpService, tenantSmtpService } from '@/services/platform'
import {
  ResourceWorkspace,
  createHref,
  matchesFilter,
  tenantLabel,
  usePlatformListQuery,
} from '@/pages/platform/resource-workspace'

export function PlatformSmtpPage() {
  const { tenants } = usePlatformTenants()
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantSmtp[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    platformSmtpService
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
        matchesFilter(list.query, tenantLabel(tenants, row.tenantId), row.host, row.fromEmail, row.fromName),
      ),
    [list.query, rows, tenants],
  )

  return (
    <ResourceWorkspace
      eyebrow="Tenant configuration"
      title="Tenant SMTP"
      description="Outbound email hosts across every institution."
      addLabel="Add SMTP"
      addTo={createHref('/platform/smtp', list.tenantId)}
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Filter host or from address"
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
        columns={['Tenant', 'Host', 'From', 'Encryption', 'Status', '']}
        empty="No SMTP records match this filter."
        rows={visible.map((row) => [
          <Link key={`${row.id}-tenant`} to={`/platform/tenants/${row.tenantId}`} className="font-medium hover:underline">
            {tenantLabel(tenants, row.tenantId)}
          </Link>,
          `${row.host}:${row.port}`,
          row.fromEmail ?? '—',
          labelize(row.encryption),
          <StatusBadge key={row.id} value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/platform/smtp/${row.tenantId}`}
            onDelete={() => {
              if (!window.confirm('Remove this SMTP configuration?')) return
              tenantSmtpService
                .delete(row.tenantId)
                .then(() => {
                  toast.success('SMTP removed')
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
