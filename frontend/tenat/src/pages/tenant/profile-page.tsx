import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { TenantFields } from '@/components/tenant-fields'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { emptyTenantDraft, tenantDraftFrom, updateTenantPayload, validateTenantDraft } from '@/lib/tenant'
import type { Tenant } from '@/lib/types'
import { tenantService } from '@/services/platform'

export function TenantProfilePage() {
  const { session } = useAuth()
  const tenantId = session?.tenantId
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [identity, setIdentity] = useState(emptyTenantDraft())
  const [savingIdentity, setSavingIdentity] = useState(false)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(!tenantId)

  const reload = useCallback(async () => {
    if (!tenantId) {
      setMissing(true)
      return
    }
    const nextTenant = await tenantService.get(tenantId)
    setTenant(nextTenant)
    setIdentity(tenantDraftFrom(nextTenant))
    setMissing(false)
  }, [tenantId])

  useEffect(() => {
    setLoading(true)
    reload()
      .catch((error) => {
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) setMissing(true)
        else toast.error(errorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [reload])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenant || !tenantId) {
    return (
      <EmptyState
        title="No institution assigned"
        description="This account is not an active member of a tenant. Ask a platform administrator to invite you."
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={tenant.tenantCode}
        title={tenant.displayName}
        description="Legal name, display name, and institution identity for this tenant."
      />
      <div className="portal-card space-y-4 p-5 sm:p-6">
        <TenantFields mode="update" value={identity} onChange={setIdentity} />
        <div className="flex justify-end">
          <Button
            disabled={savingIdentity}
            onClick={() => {
              const identityError = validateTenantDraft(identity, 'update')
              if (identityError) {
                toast.error(identityError)
                return
              }
              setSavingIdentity(true)
              tenantService
                .update(tenant.id, updateTenantPayload(identity))
                .then(() => reload())
                .then(() => toast.success('Institution updated'))
                .catch((error) => toast.error(errorMessage(error)))
                .finally(() => setSavingIdentity(false))
            }}
          >
            {savingIdentity ? 'Saving…' : 'Save institution'}
          </Button>
        </div>
      </div>
    </div>
  )
}
