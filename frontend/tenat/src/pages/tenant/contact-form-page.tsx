import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ContactFields } from '@/components/contact-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { contactDraftFrom, contactPayload, emptyContactDraft, validateContact } from '@/lib/contact'
import { tenantContactService } from '@/services/platform'
import { ResourceFormLayout } from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantContactFormPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantContactForm tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantContactForm({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [draft, setDraft] = useState(emptyContactDraft())
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    tenantContactService
      .get(tenantId, id)
      .then((row) => setDraft(contactDraftFrom(row)))
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/tenant/contacts', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, tenantId])

  async function submit() {
    const error = validateContact(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = contactPayload(draft)
      if (isEdit && id) await tenantContactService.update(tenantId, id, body)
      else await tenantContactService.create(tenantId, body)
      toast.success(isEdit ? 'Contact updated' : 'Contact added')
      navigate('/tenant/contacts')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-[var(--radius)]" />

  return (
    <ResourceFormLayout
      eyebrow="Institution"
      title={isEdit ? 'Edit contact' : 'Add contact'}
      description="First name and contact type are required."
      backTo="/tenant/contacts"
      backLabel="Back to contacts"
    >
      <ContactFields value={draft} onChange={setDraft} />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : isEdit ? 'Save contact' : 'Add contact'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
