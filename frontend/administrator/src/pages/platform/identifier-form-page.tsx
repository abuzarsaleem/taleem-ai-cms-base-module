import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IdentifierFields } from '@/components/identifier-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { emptyIdentifierDraft, identifierDraftFrom, identifierPayload, validateIdentifier } from '@/lib/identifier'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { tenantIdentifierService } from '@/services/platform'
import { ResourceFormLayout, TenantPicker } from '@/pages/platform/resource-workspace'

export function PlatformIdentifierFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId, id } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId && id)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [draft, setDraft] = useState(emptyIdentifierDraft())
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !routeTenantId || !id) return
    tenantIdentifierService
      .get(routeTenantId, id)
      .then((row) => {
        setFormTenantId(row.tenantId)
        setDraft(identifierDraftFrom(row))
      })
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/platform/identifiers', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, routeTenantId])

  async function submit() {
    if (!formTenantId) {
      toast.error('Select a tenant')
      return
    }
    const error = validateIdentifier(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = identifierPayload(draft, isEdit ? 'update' : 'create')
      if (isEdit && id) await tenantIdentifierService.update(formTenantId, id, body)
      else await tenantIdentifierService.create(formTenantId, body)
      toast.success(isEdit ? 'Identifier updated' : 'Identifier added')
      navigate('/platform/identifiers')
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
      title={isEdit ? 'Edit identifier' : 'Add identifier'}
      description="Type and value are required."
      backTo="/platform/identifiers"
      backLabel="Back to identifiers"
    >
      <TenantPicker tenants={tenants} value={formTenantId} onChange={setFormTenantId} disabled={isEdit} />
      <IdentifierFields value={draft} onChange={setDraft} showVerified={isEdit} />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : isEdit ? 'Save identifier' : 'Add identifier'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
