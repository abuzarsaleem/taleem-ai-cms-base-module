import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, KeyRound, Lock, Plus, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApplicationIcon } from '@/components/application-icon'
import { CreateOAuthClientDialog } from '@/components/create-oauth-client-dialog'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/filters'
import { PageHeader } from '@/components/page-header'
import { StatMetricCard, type StatMetricTone } from '@/components/stat-metric-card'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { errorMessage } from '@/lib/auth'
import { OAuthClientType, type CatalogApplication, type CreateOAuthClientResponse, type OAuthClient } from '@/lib/types'
import { applicationService, oauthClientService } from '@/services/platform'

export function OAuthClientsPage() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<OAuthClient[]>([])
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [open, setOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<CreateOAuthClientResponse | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | OAuthClientType>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function load() {
    const [clientResult, appResult] = await Promise.all([
      oauthClientService.list(1, 100),
      applicationService.list(1, 100),
    ])
    setClients(clientResult.data)
    setApplications(appResult.data)
  }

  useEffect(() => {
    load()
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const appById = useMemo(
    () => Object.fromEntries(applications.map((app) => [app.id, app])),
    [applications],
  )

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients.filter((client) => {
      if (typeFilter !== 'ALL' && client.clientType !== typeFilter) return false
      if (statusFilter !== 'ALL' && client.status !== statusFilter) return false
      if (!q) return true
      const app = appById[client.applicationId]
      return (
        client.clientName.toLowerCase().includes(q) ||
        client.clientId.toLowerCase().includes(q) ||
        (app?.name ?? '').toLowerCase().includes(q) ||
        (app?.applicationCode ?? '').toLowerCase().includes(q)
      )
    })
  }, [clients, search, typeFilter, statusFilter, appById])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, statusFilter, pageSize])

  const pagedClients = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, page, pageSize])

  const stats = useMemo(() => {
    const confidential = clients.filter((c) => c.clientType === OAuthClientType.CONFIDENTIAL).length
    const pub = clients.filter((c) => c.clientType === OAuthClientType.PUBLIC).length
    const active = clients.filter((c) => c.status === 'ACTIVE').length
    return { total: clients.length, confidential, public: pub, active }
  }, [clients])

  const statuses = useMemo(
    () => Array.from(new Set(clients.map((client) => client.status).filter(Boolean))),
    [clients],
  )

  const statCards: Array<{
    title: string
    value: number
    icon: typeof Lock
    tone: StatMetricTone
  }> = [
    {
      title: 'Total clients',
      value: stats.total,
      icon: Lock,
      tone: 'violet',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircle2,
      tone: 'green',
    },
    {
      title: 'Confidential',
      value: stats.confidential,
      icon: Shield,
      tone: 'blue',
    },
    {
      title: 'Public',
      value: stats.public,
      icon: KeyRound,
      tone: 'amber',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="OAuth"
        title="OAuth clients"
        description="Register OAuth 2.0 clients for catalogue applications."
        quote={['Trusted identity', 'across the platform']}
        actions={
          <Button disabled={!applications.length} onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Register OAuth client
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              hint="From registered catalogue clients"
            />
          ))}
        </section>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <FilterBar
          className="border-b border-border p-3"
          canClear={Boolean(search) || typeFilter !== 'ALL' || statusFilter !== 'ALL'}
          onClear={() => {
            setSearch('')
            setTypeFilter('ALL')
            setStatusFilter('ALL')
          }}
        >
          <FilterSearch value={search} onChange={setSearch} placeholder="Search clients, IDs, or applications..." />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as 'ALL' | OAuthClientType)}
            options={[
              { value: 'ALL', label: 'All' },
              { value: OAuthClientType.CONFIDENTIAL, label: 'Confidential' },
              { value: OAuthClientType.PUBLIC, label: 'Public' },
            ]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All' },
              ...statuses.map((status) => ({ value: status, label: status })),
            ]}
          />
        </FilterBar>

        {loading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>
                  Client
                </TableHead>
                <TableHead>
                  Application
                </TableHead>
                <TableHead>
                  Type
                </TableHead>
                <TableHead>
                  Status
                </TableHead>
                <TableHead>
                  Redirect URIs
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedClients.map((client) => {
                const app = appById[client.applicationId]
                return (
                  <TableRow key={client.id} className="border-border">
                    <TableCell>
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                          <Lock className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{client.clientName}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{client.clientId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{app.name}</p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {app.applicationCode}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">{client.applicationId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.clientType}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={client.status} />
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
                        {client.redirectUris.map((uri) => (
                          <li key={uri} className="max-w-xs truncate" title={uri}>
                            {uri}
                          </li>
                        ))}
                        {!client.redirectUris.length ? <li>—</li> : null}
                      </ul>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!pagedClients.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {clients.length ? 'No clients match your filters.' : 'No OAuth clients registered yet.'}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading ? (
        <TablePagination
          page={page}
          total={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next)
            setPage(1)
          }}
        />
      ) : null}

      <CreateOAuthClientDialog
        open={open}
        onOpenChange={setOpen}
        applications={applications}
        onCreated={(client) => {
          setClients((current) => [...current, client])
          if (client.clientSecret) setCreatedSecret(client)
          toast.success('OAuth client registered')
        }}
      />

      <Dialog open={Boolean(createdSecret)} onOpenChange={(next) => !next && setCreatedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save the client secret</DialogTitle>
            <DialogDescription>
              This secret is shown only once. Copy it now and store it securely for{' '}
              <span className="font-mono">{createdSecret?.clientId}</span>.
            </DialogDescription>
          </DialogHeader>
          {createdSecret?.clientSecret ? (
            <div className="rounded-xl border border-border bg-muted/40 px-3 py-3 font-mono text-sm break-all">
              {createdSecret.clientSecret}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (createdSecret?.clientSecret) {
                  void navigator.clipboard.writeText(createdSecret.clientSecret)
                  toast.success('Client secret copied')
                }
              }}
            >
              <Copy />
              Copy secret
            </Button>
            <Button onClick={() => setCreatedSecret(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
