import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
        description="POST/PATCH /tenant/:id/smtp — host is required. Store a secret reference, never a password."
        action={
          smtp ? (
            <Button
              variant="outline"
              onClick={() =>
                void tenantSmtpService
                  .delete(tenantId)
                  .then(() => {
                    toast.success('SMTP removed')
                    setDraft(emptySmtpDraft())
                    return onReload()
                  })
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Delete SMTP
            </Button>
          ) : null
        }
      />
      <div className="space-y-4">
        <SmtpFields value={draft} onChange={setDraft} />
        <div className="flex justify-end">
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : smtp ? 'Update SMTP' : 'Create SMTP'}
          </Button>
        </div>
      </div>
    </section>
  )
}
