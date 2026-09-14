import { useEffect, useMemo, useState } from 'react'
import { Copy, Lock } from 'lucide-react'
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
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import type { CatalogApplication, CreateOAuthClientResponse, OAuthClient } from '@/lib/types'
import { applicationService, oauthClientService } from '@/services/platform'

export function OAuthClientsPage() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<OAuthClient[]>([])
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [open, setOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<CreateOAuthClientResponse | null>(null)

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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="OAuth"
        title="OAuth clients"
        description="Register OAuth 2.0 clients for catalogue applications. External apps use these credentials to sign users in through Taleem."
        actions={
          <Button disabled={!applications.length} onClick={() => setOpen(true)}>
            Register OAuth client
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--portal-shadow)]">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Redirect URIs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const app = appById[client.applicationId]
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                          <Lock className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{client.clientName}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{client.clientId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app ? (
                        <div className="flex items-center gap-2">
                          <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium">{app.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
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
                      </ul>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!clients.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No OAuth clients registered yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

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
