import { useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/data-table'
import { Field } from '@/components/field'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import {
  formatInvitationInstant,
  invitationAcceptUrl,
  invitationIsPending,
  invitationPayload,
  validateInvitationEmail,
} from '@/lib/invitation'
import { InvitationStatus, type AdminInvitation } from '@/lib/types'
import { invitationService } from '@/services/platform'

type InvitationApi = {
  create: (tenantId: string, email: string) => Promise<AdminInvitation & { invitationToken: string }>
  resend: (tenantId: string, id: string) => Promise<AdminInvitation & { invitationToken: string }>
  cancel: (tenantId: string, id: string) => Promise<AdminInvitation>
}

export function TenantInvitationsPanel({
  tenantId,
  invitations,
  canInvite = true,
  blockedReason,
  title = 'Administrator invitations',
  description = 'POST /tenant/:id/admin-invitation — email only. The token is returned once on create and resend.',
  dialogTitle = 'Invite tenant administrator',
  dialogDescription = 'Only an email address is sent. A second pending invite, or an email that is already an active tenant admin, is rejected.',
  empty = 'No administrator invitations yet.',
  service = invitationService,
  onReload,
}: {
  tenantId: string
  invitations: AdminInvitation[]
  canInvite?: boolean
  blockedReason?: string
  title?: string
  description?: string
  dialogTitle?: string
  dialogDescription?: string
  empty?: string
  service?: InvitationApi
  onReload: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [issued, setIssued] = useState<{ email: string; token: string; expiresAt: string } | null>(null)

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }

  async function save() {
    if (!canInvite) {
      toast.error(blockedReason ?? 'Invites are not available yet')
      return
    }
    const error = validateInvitationEmail(email)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const created = await service.create(tenantId, invitationPayload(email).email)
      setIssued({ email: created.email, token: created.invitationToken, expiresAt: String(created.expiresAt) })
      setEmail('')
      setOpen(false)
      toast.success('Invitation created')
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function resend(id: string) {
    try {
      const next = await service.resend(tenantId, id)
      setIssued({ email: next.email, token: next.invitationToken, expiresAt: String(next.expiresAt) })
      toast.success('Invitation resent')
      await onReload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function cancel(id: string) {
    try {
      await service.cancel(tenantId, id)
      toast.success('Invitation cancelled')
      await onReload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <SectionTitle
        title={title}
        description={description}
        action={
          <Button disabled={!canInvite} onClick={() => setOpen(true)}>
            Send invite
          </Button>
        }
      />
      {!canInvite && blockedReason ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm">{blockedReason}</p>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!canInvite) return
          setOpen(next)
          if (next) setEmail('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <Field label="Email" required hint="Max 255 characters. Stored in lowercase.">
            <Input
              type="email"
              value={email}
              autoComplete="email"
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button disabled={busy || !email.trim()} onClick={() => void save()}>
              {busy ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {issued ? (
        <div className="mb-4 space-y-3 rounded-xl border border-[#00c2b2]/30 bg-[#00c2b2]/8 p-4">
          <p className="text-sm font-medium">
            Share this link with {issued.email}. It is only shown after create or resend.
          </p>
          <p className="text-xs text-muted-foreground">Expires {formatInvitationInstant(issued.expiresAt)}</p>
          <div className="flex flex-col gap-2">
            <code className="block break-all rounded-lg bg-background/80 px-3 py-2 font-mono text-xs">
              {invitationAcceptUrl(issued.token)}
            </code>
            <code className="block break-all rounded-lg bg-background/80 px-3 py-2 font-mono text-xs">{issued.token}</code>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void copy('Accept link', invitationAcceptUrl(issued.token))}>
                <Copy />
                Copy link
              </Button>
              <Button size="sm" variant="outline" onClick={() => void copy('Token', issued.token)}>
                <Copy />
                Copy token
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <DataTable
        columns={['Email', 'Role', 'Status', 'Expires', '']}
        empty={empty}
        rows={invitations.map((row) => {
          const pending = invitationIsPending(row)
          const expiredPending = row.status === InvitationStatus.PENDING && !pending
          return [
            row.email,
            row.role.replaceAll('_', ' '),
            <StatusBadge key={`${row.id}-status`} value={expiredPending ? InvitationStatus.EXPIRED : row.status} />,
            formatInvitationInstant(row.expiresAt),
            pending ? (
              <div key={`${row.id}-inv`} className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => void resend(row.id)}>
                  Resend
                </Button>
                <Button size="sm" variant="outline" onClick={() => void cancel(row.id)}>
                  Cancel
                </Button>
              </div>
            ) : (
              ''
            ),
          ]
        })}
      />
    </div>
  )
}
