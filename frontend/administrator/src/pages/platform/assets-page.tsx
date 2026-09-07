import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { errorMessage } from '@/lib/auth'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { labelize } from '@/lib/utils'
import type { TenantAsset } from '@/lib/types'
import { platformAssetService, tenantAssetService } from '@/services/platform'
import {
  ResourceWorkspace,
  createHref,
  matchesFilter,
  tenantLabel,
  usePlatformListQuery,
} from '@/pages/platform/resource-workspace'

export function PlatformAssetsPage() {
  const { tenants } = usePlatformTenants()
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantAsset[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    platformAssetService
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
        matchesFilter(list.query, tenantLabel(tenants, row.tenantId), row.assetType, row.fileName, row.fileUrl),
      ),
    [list.query, rows, tenants],
  )

  return (
    <ResourceWorkspace
      eyebrow="Tenant configuration"
      title="Tenant assets"
      description="Logos, banners, and documents across every institution."
      addLabel="Add asset"
      addTo={createHref('/platform/assets', list.tenantId)}
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Filter file or type"
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
        columns={['Tenant', 'Type', 'File', 'URL', '']}
        empty="No assets match this filter."
        rows={visible.map((row) => [
          <Link key={`${row.id}-tenant`} to={`/platform/tenants/${row.tenantId}`} className="font-medium hover:underline">
            {tenantLabel(tenants, row.tenantId)}
          </Link>,
          labelize(row.assetType),
          row.fileName ?? '—',
          <span key={row.id} className="block max-w-xs truncate font-mono text-xs">
            {row.fileUrl}
          </span>,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/platform/assets/${row.tenantId}/${row.id}`}
            onDelete={() => {
              if (!window.confirm('Remove this asset?')) return
              tenantAssetService
                .delete(row.tenantId, row.id)
                .then(() => {
                  toast.success('Asset removed')
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
