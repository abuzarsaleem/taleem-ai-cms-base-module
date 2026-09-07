import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { SmtpFields } from '@/components/smtp-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { emptySmtpDraft, smtpDraftFrom, smtpPayload, validateSmtp } from '@/lib/smtp'
import { tenantSmtpService } from '@/services/platform'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantSmtpPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantSmtpForm tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantSmtpForm({ tenantId }: { tenantId: string }) {
  const [draft, setDraft] = useState(emptySmtpDraft())
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    tenantSmtpService
      .get(tenantId)
      .then((row) => {
        setDraft(smtpDraftFrom(row))
        setExists(true)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setExists(false)
          setDraft(emptySmtpDraft())
          return
        }
        toast.error(errorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  async function submit() {
    const error = validateSmtp(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = smtpPayload(draft)
      if (exists) await tenantSmtpService.update(tenantId, body)
      else await tenantSmtpService.create(tenantId, body)
      setExists(true)
      toast.success(exists ? 'SMTP updated' : 'SMTP created')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-[var(--radius)]" />

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Institution"
        title="SMTP"
        description="Host is required. Store a secret reference, not a password."
        actions={
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? 'Saving…' : exists ? 'Save SMTP' : 'Add SMTP'}
          </Button>
        }
      />
      <div className="portal-card space-y-5 p-5 sm:p-6">
        <SmtpFields value={draft} onChange={setDraft} />
      </div>
    </div>
  )
}
