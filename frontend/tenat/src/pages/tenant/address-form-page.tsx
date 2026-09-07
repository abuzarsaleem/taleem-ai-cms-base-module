import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressFields } from '@/components/address-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { addressDraftFrom, addressPayload, emptyAddressDraft, validateAddress } from '@/lib/address'
import { tenantAddressService } from '@/services/platform'
import { ResourceFormLayout } from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantAddressFormPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantAddressForm tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantAddressForm({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [draft, setDraft] = useState(emptyAddressDraft())
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    tenantAddressService
      .get(tenantId, id)
      .then((row) => setDraft(addressDraftFrom(row)))
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/tenant/addresses', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, tenantId])

  async function submit() {
    const error = validateAddress(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = addressPayload(draft)
      if (isEdit && id) await tenantAddressService.update(tenantId, id, body)
      else await tenantAddressService.create(tenantId, body)
      toast.success(isEdit ? 'Address updated' : 'Address added')
      navigate('/tenant/addresses')
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
      title={isEdit ? 'Edit address' : 'Add address'}
      description="Type, line 1, and city are required."
      backTo="/tenant/addresses"
      backLabel="Back to addresses"
    >
      <AddressFields value={draft} onChange={setDraft} />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : isEdit ? 'Save address' : 'Add address'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
