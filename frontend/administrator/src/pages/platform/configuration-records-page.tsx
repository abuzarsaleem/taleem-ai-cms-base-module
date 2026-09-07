import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { errorMessage } from '@/lib/auth'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import type { TenantConfiguration } from '@/lib/types'
import { platformConfigurationService, tenantConfigurationService } from '@/services/platform'
import {
  ResourceWorkspace,
  createHref,
  matchesFilter,
  tenantLabel,
  usePlatformListQuery,
} from '@/pages/platform/resource-workspace'

export function PlatformConfigurationPage() {
  const { tenants } = usePlatformTenants()
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantConfiguration[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    platformConfigurationService
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
        matchesFilter(list.query, tenantLabel(tenants, row.tenantId), row.timezone, row.locale, row.currencyCode),
      ),
    [list.query, rows, tenants],
  )

  return (
    <ResourceWorkspace
      eyebrow="Tenant configuration"
      title="Tenant configuration"
      description="Locale, timezone, currency, and branding settings across every institution."
      addLabel="Add configuration"
      addTo={createHref('/platform/configuration', list.tenantId)}
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Filter timezone or locale"
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
        columns={['Tenant', 'Timezone', 'Locale', 'Currency', 'Updated', '']}
        empty="No configuration records match this filter."
        rows={visible.map((row) => [
          <Link key={`${row.id}-tenant`} to={`/platform/tenants/${row.tenantId}`} className="font-medium hover:underline">
            {tenantLabel(tenants, row.tenantId)}
          </Link>,
          row.timezone,
          row.locale,
          row.currencyCode,
          String(row.updatedAt).slice(0, 10),
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/platform/configuration/${row.tenantId}`}
            onDelete={() => {
              if (!window.confirm('Remove this configuration?')) return
              tenantConfigurationService
                .delete(row.tenantId)
                .then(() => {
                  toast.success('Configuration removed')
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
