import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ContactFields } from '@/components/contact-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { contactDraftFrom, contactPayload, emptyContactDraft, validateContact } from '@/lib/contact'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { tenantContactService } from '@/services/platform'
import { ResourceFormLayout, TenantPicker } from '@/pages/platform/resource-workspace'

export function PlatformContactFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId, id } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId && id)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [draft, setDraft] = useState(emptyContactDraft())
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !routeTenantId || !id) return
    tenantContactService
      .get(routeTenantId, id)
      .then((row) => {
        setFormTenantId(row.tenantId)
        setDraft(contactDraftFrom(row))
      })
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/platform/contacts', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, routeTenantId])

  async function submit() {
    if (!formTenantId) {
      toast.error('Select a tenant')
      return
    }
    const error = validateContact(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = contactPayload(draft)
      if (isEdit && id) await tenantContactService.update(formTenantId, id, body)
      else await tenantContactService.create(formTenantId, body)
      toast.success(isEdit ? 'Contact updated' : 'Contact added')
      navigate('/platform/contacts')
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
      title={isEdit ? 'Edit contact' : 'Add contact'}
      description="First name and contact type are required."
      backTo="/platform/contacts"
      backLabel="Back to contacts"
    >
      <TenantPicker tenants={tenants} value={formTenantId} onChange={setFormTenantId} disabled={isEdit} />
      <ContactFields value={draft} onChange={setDraft} />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : isEdit ? 'Save contact' : 'Add contact'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
