import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import type { TenantAsset } from '@/lib/types'
import { tenantAssetService } from '@/services/platform'
import {
  ResourceWorkspace,
  matchesFilter,
  usePlatformListQuery,
} from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantAssetsPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantAssetsList tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantAssetsList({ tenantId }: { tenantId: string }) {
  const list = usePlatformListQuery()
  const [rows, setRows] = useState<TenantAsset[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    tenantAssetService
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
    () => rows.filter((row) => matchesFilter(list.query, row.assetType, row.fileName, row.fileUrl)),
    [list.query, rows],
  )

  return (
    <ResourceWorkspace
      eyebrow="Institution"
      title="Assets"
      description="Logos, banners, and documents for this institution."
      addLabel="Add asset"
      addTo="/tenant/assets/new"
      query={list.query}
      onQuery={list.setQuery}
      queryPlaceholder="Filter file or type"
      showTenantFilter={false}
      loading={loading}
      page={list.page}
      total={total}
      pageSize={list.pageSize}
      onPageChange={list.onPageChange}
      onPageSizeChange={list.onPageSizeChange}
    >
      <DataTable
        columns={['Type', 'File', 'URL', '']}
        empty="No assets match this filter."
        rows={visible.map((row) => [
          labelize(row.assetType),
          row.fileName ?? '—',
          <span key={row.id} className="block max-w-xs truncate font-mono text-xs">
            {row.fileUrl}
          </span>,
          <RowActions
            key={`${row.id}-actions`}
            editTo={`/tenant/assets/${row.id}`}
            deleteTitle="Remove this asset?"
            deleteDescription="This file will be removed from the institution."
            onDelete={() =>
              tenantAssetService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Asset removed')
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
