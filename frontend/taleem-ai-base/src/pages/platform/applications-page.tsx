import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Field } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApplicationStatus, type CatalogApplication } from '@/lib/types'
import { applicationService } from '@/services/platform'

export function ApplicationsPage() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [launchUrl, setLaunchUrl] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<CatalogApplication[]>([])

  async function load() {
    const result = await applicationService.list(1, 100)
    setRows(result.data)
  }

  useEffect(() => {
    load()
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Application catalogue"
        description="Register independently deployable applications. The catalogue does not store application business data."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Register application</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register application</DialogTitle>
                <DialogDescription>Unique application identity and launch information.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field label="Application code">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                </Field>
                <Field label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Launch URL">
                  <Input value={launchUrl} onChange={(e) => setLaunchUrl(e.target.value)} />
                </Field>
                <Field label="Description">
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
              </div>
              <DialogFooter>
                <Button
                  disabled={busy || !code || !name}
                  onClick={() => {
                    setBusy(true)
                    applicationService
                      .create({
                        applicationCode: code,
                        name,
                        launchUrl: launchUrl || undefined,
                        description: description || undefined,
                      })
                      .then(async () => {
                        await load()
                        setOpen(false)
                        setCode('')
                        setName('')
                        setLaunchUrl('')
                        setDescription('')
                        toast.success('Application registered')
                      })
                      .catch((error) => toast.error(errorMessage(error)))
                      .finally(() => setBusy(false))
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--portal-shadow)]">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.description}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{app.applicationCode}</TableCell>
                  <TableCell>{app.version ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge value={app.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === ApplicationStatus.ACTIVE ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          applicationService
                            .deactivate(app.id)
                            .then(async () => {
                              await load()
                              toast.success(`${app.name} marked ineligible`)
                            })
                            .catch((error) => toast.error(errorMessage(error)))
                        }}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No applications registered yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
