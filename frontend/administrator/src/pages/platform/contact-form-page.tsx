import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ContactFields } from '@/components/contact-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  contactDraftFrom,
  contactFieldErrors,
  contactPayload,
  emptyContactDraft,
  type ContactDraft,
} from '@/lib/contact'
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
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDraft, string>>>({})
  const [tenantError, setTenantError] = useState<string | null>(null)
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
      setTenantError('Select a tenant')
      return
    }
    setTenantError(null)
    const nextErrors = contactFieldErrors(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
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
      description="First name, email, and contact type are required."
      backTo="/platform/contacts"
      backLabel="Back to contacts"
    >
      <div className="space-y-1.5">
        <TenantPicker
          tenants={tenants}
          value={formTenantId}
          onChange={(value) => {
            setFormTenantId(value)
            setTenantError(null)
          }}
          disabled={isEdit}
        />
        {tenantError ? <p className="text-xs text-destructive">{tenantError}</p> : null}
      </div>
      <ContactFields
        value={draft}
        errors={errors}
        onChange={(next) => {
          setDraft(next)
          if (Object.keys(errors).length) setErrors(contactFieldErrors(next))
        }}
      />
      <div className="flex justify-end">
        <Button loading={busy} onClick={() => void submit()}>
          {isEdit ? 'Save contact' : 'Add contact'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
