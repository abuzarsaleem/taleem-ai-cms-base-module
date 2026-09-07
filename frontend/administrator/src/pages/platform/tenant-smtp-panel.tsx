import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { SectionTitle } from '@/components/section-title'
import { SmtpFields } from '@/components/smtp-fields'
import { errorMessage } from '@/lib/auth'
import { emptySmtpDraft, smtpDraftFrom, smtpPayload, validateSmtp } from '@/lib/smtp'
import type { TenantSmtp } from '@/lib/types'
import { tenantSmtpService } from '@/services/platform'

export function TenantSmtpPanel({
  tenantId,
  smtp,
  onReload,
}: {
  tenantId: string
  smtp: TenantSmtp | null
  onReload: () => Promise<void>
}) {
  const [draft, setDraft] = useState(() => (smtp ? smtpDraftFrom(smtp) : emptySmtpDraft()))
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function save() {
    const error = validateSmtp(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const payload = smtpPayload(draft)
      if (smtp) await tenantSmtpService.update(tenantId, payload)
      else await tenantSmtpService.create(tenantId, payload)
      toast.success(smtp ? 'SMTP updated' : 'SMTP created')
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="py-8">
      <SectionTitle
        title="SMTP"
        description="Host is required. Store a secret reference, never a password."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {smtp ? (
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete SMTP
              </Button>
            ) : null}
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : smtp ? 'Update SMTP' : 'Add SMTP'}
            </Button>
          </div>
        }
      />
      <SmtpFields value={draft} onChange={setDraft} />
      <ConfirmDialog
        open={confirmDelete}
        title="Remove this SMTP configuration?"
        description="Outbound email settings for this institution will be removed."
        pending={busy}
        onOpenChange={setConfirmDelete}
        onConfirm={async () => {
          setBusy(true)
          try {
            await tenantSmtpService.delete(tenantId)
            toast.success('SMTP removed')
            setDraft(emptySmtpDraft())
            setConfirmDelete(false)
            await onReload()
          } catch (error) {
            toast.error(errorMessage(error))
          } finally {
            setBusy(false)
          }
        }}
      />
    </section>
  )
}
