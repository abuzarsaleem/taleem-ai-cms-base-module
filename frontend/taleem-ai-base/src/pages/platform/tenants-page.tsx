import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { TenantLifecycleMenu } from '@/components/tenant-lifecycle-menu'
import { errorMessage } from '@/lib/auth'
import type { Tenant } from '@/lib/types'
import { tenantService } from '@/services/platform'

export function TenantsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
  const pageSize = Number(searchParams.get('pageSize') || 10) || 10
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    tenantService
      .list(page, pageSize)
      .then((result) => {
        setRows(result.data)
        setTotal(result.meta.total)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const visible = rows.filter((tenant) =>
    `${tenant.displayName} ${tenant.legalName} ${tenant.tenantCode} ${tenant.city ?? ''} ${tenant.institutionType}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Tenants"
        title="Tenants"
        description="Create an institution, then activate, suspend, or retire it from this list."
        actions={
          <Button asChild>
            <Link to="/platform/tenants/new">
              <Plus />
              Add tenant
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4">
        <div className="max-w-sm">
          <Input placeholder="Filter this page" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {loading ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--portal-shadow)]">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Link to={`/platform/tenants/${tenant.id}`} className="font-medium hover:underline">
                        {tenant.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{tenant.legalName}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tenant.tenantCode}</TableCell>
                    <TableCell>{tenant.institutionType.replaceAll('_', ' ')}</TableCell>
                    <TableCell>{tenant.city ?? '—'}</TableCell>
                    <TableCell>{tenant.deploymentModel.replaceAll('_', ' ')}</TableCell>
                    <TableCell>
                      <StatusBadge value={tenant.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TenantLifecycleMenu tenant={tenant} onChanged={() => load(true)} />
                    </TableCell>
                  </TableRow>
                ))}
                {!visible.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No tenants yet. Add the first institution.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
        <TablePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={(next) => {
            const params = new URLSearchParams(searchParams)
            params.set('page', String(next))
            setSearchParams(params)
          }}
          onPageSizeChange={(next) => {
            const params = new URLSearchParams(searchParams)
            params.set('pageSize', String(next))
            params.set('page', '1')
            setSearchParams(params)
          }}
        />
      </div>
    </div>
  )
}
