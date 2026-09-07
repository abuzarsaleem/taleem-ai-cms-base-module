import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IdentifierFields } from '@/components/identifier-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { emptyIdentifierDraft, identifierDraftFrom, identifierPayload, validateIdentifier } from '@/lib/identifier'
import { tenantIdentifierService } from '@/services/platform'
import { ResourceFormLayout } from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantIdentifierFormPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantIdentifierForm tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantIdentifierForm({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [draft, setDraft] = useState(emptyIdentifierDraft())
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    tenantIdentifierService
      .get(tenantId, id)
      .then((row) => setDraft(identifierDraftFrom(row)))
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/tenant/identifiers', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, tenantId])

  async function submit() {
    const error = validateIdentifier(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = identifierPayload(draft, isEdit ? 'update' : 'create')
      if (isEdit && id) await tenantIdentifierService.update(tenantId, id, body)
      else await tenantIdentifierService.create(tenantId, body)
      toast.success(isEdit ? 'Identifier updated' : 'Identifier added')
      navigate('/tenant/identifiers')
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
      title={isEdit ? 'Edit identifier' : 'Add identifier'}
      description="Type and value are required."
      backTo="/tenant/identifiers"
      backLabel="Back to identifiers"
    >
      <IdentifierFields value={draft} onChange={setDraft} showVerified={isEdit} />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : isEdit ? 'Save identifier' : 'Add identifier'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
