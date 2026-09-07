import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SmtpFields } from '@/components/smtp-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { emptySmtpDraft, smtpDraftFrom, smtpPayload, validateSmtp } from '@/lib/smtp'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { tenantSmtpService } from '@/services/platform'
import { ResourceFormLayout, TenantPicker } from '@/pages/platform/resource-workspace'

export function PlatformSmtpFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [draft, setDraft] = useState(emptySmtpDraft())
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)
  const [exists, setExists] = useState(isEdit)

  useEffect(() => {
    if (!isEdit || !routeTenantId) return
    tenantSmtpService
      .get(routeTenantId)
      .then((row) => {
        setFormTenantId(row.tenantId)
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
        navigate('/platform/smtp', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [isEdit, navigate, routeTenantId])

  async function submit() {
    if (!formTenantId) {
      toast.error('Select a tenant')
      return
    }
    const error = validateSmtp(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = smtpPayload(draft)
      if (exists) await tenantSmtpService.update(formTenantId, body)
      else await tenantSmtpService.create(formTenantId, body)
      toast.success(exists ? 'SMTP updated' : 'SMTP created')
      navigate('/platform/smtp')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading || tenantsLoading) {
    return <Skeleton className="h-96 rounded-[var(--radius)]" />
  }

  return (
    <ResourceFormLayout
      eyebrow="Tenant configuration"
      title={exists ? 'Edit SMTP' : 'Add SMTP'}
      description="Host is required. Store a secret reference, not a password."
      backTo="/platform/smtp"
      backLabel="Back to SMTP"
    >
      <TenantPicker tenants={tenants} value={formTenantId} onChange={setFormTenantId} disabled={isEdit} />
      <SmtpFields value={draft} onChange={setDraft} />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : exists ? 'Save SMTP' : 'Add SMTP'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
