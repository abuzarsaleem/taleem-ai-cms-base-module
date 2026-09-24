import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressFields } from '@/components/address-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  addressDraftFrom,
  addressFieldErrors,
  addressPayload,
  emptyAddressDraft,
  type AddressDraft,
} from '@/lib/address'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { tenantAddressService } from '@/services/platform'
import { ResourceFormLayout, TenantPicker } from '@/pages/platform/resource-workspace'

export function PlatformAddressFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId, id } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId && id)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [draft, setDraft] = useState(emptyAddressDraft())
  const [errors, setErrors] = useState<Partial<Record<keyof AddressDraft, string>>>({})
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !routeTenantId || !id) return
    tenantAddressService
      .get(routeTenantId, id)
      .then((row) => {
        setFormTenantId(row.tenantId)
        setDraft(addressDraftFrom(row))
      })
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/platform/addresses', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, routeTenantId])

  async function submit() {
    if (!formTenantId) {
      setTenantError('Select a tenant')
      return
    }
    setTenantError(null)
    const nextErrors = addressFieldErrors(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    try {
      const body = addressPayload(draft)
      if (isEdit && id) await tenantAddressService.update(formTenantId, id, body)
      else await tenantAddressService.create(formTenantId, body)
      toast.success(isEdit ? 'Address updated' : 'Address added')
      navigate('/platform/addresses')
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
      title={isEdit ? 'Edit address' : 'Add address'}
      description="Type, line 1, and city are required."
      backTo="/platform/addresses"
      backLabel="Back to addresses"
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
      <AddressFields
        value={draft}
        errors={errors}
        onChange={(next) => {
          setDraft(next)
          if (Object.keys(errors).length) setErrors(addressFieldErrors(next))
        }}
      />
      <div className="flex justify-end">
        <Button loading={busy} onClick={() => void submit()}>
          {isEdit ? 'Save address' : 'Add address'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
