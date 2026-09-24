import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, KeyRound, Lock, Plus, Search, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApplicationIcon } from '@/components/application-icon'
import { CreateOAuthClientDialog } from '@/components/create-oauth-client-dialog'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { cn } from '@/lib/utils'
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

  const statCards = [
    {
      title: 'Total clients',
      value: stats.total,
      icon: Lock,
      tone: 'bg-violet-500/10 text-violet-600',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircle2,
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: 'Confidential',
      value: stats.confidential,
      icon: Shield,
      tone: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Public',
      value: stats.public,
      icon: KeyRound,
      tone: 'bg-amber-500/10 text-amber-700',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="OAuth"
        title="OAuth clients"
        description="Register OAuth 2.0 clients for catalogue applications. External apps use these credentials to sign users in through Taleem."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} size="sm" className="portal-card border-border">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-1">
                <div>
                  <CardDescription className="text-xs font-medium">{card.title}</CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</CardTitle>
                </div>
                <span className={cn('inline-flex size-8 items-center justify-center rounded-md', card.tone)}>
                  <card.icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">From registered catalogue clients</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 border-border bg-background pl-8"
              placeholder="Search clients, IDs, or applications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <SearchableSelect
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as 'ALL' | OAuthClientType)}
            className="w-full sm:w-40"
            options={[
              { value: 'ALL', label: 'All types' },
              { value: OAuthClientType.CONFIDENTIAL, label: 'Confidential' },
              { value: OAuthClientType.PUBLIC, label: 'Public' },
            ]}
            placeholder="Type"
          />
          <SearchableSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-40"
            options={[
              { value: 'ALL', label: 'All statuses' },
              ...statuses.map((status) => ({ value: status, label: status })),
            ]}
            placeholder="Status"
          />
          <Button
            className="shrink-0 sm:ml-auto"
            disabled={!applications.length}
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" />
            Register OAuth client
          </Button>
        </div>

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
              {filteredClients.map((client) => {
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
              {!filteredClients.length ? (
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
