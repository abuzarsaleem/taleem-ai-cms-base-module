import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import type { Tenant } from '@/lib/types'
import { tenantService } from '@/services/platform'

export function useOwnTenant() {
  const { session } = useAuth()
  const tenantId = session?.tenantId
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  const reload = useCallback(async () => {
    if (!tenantId) {
      setTenant(null)
      setMissing(true)
      return
    }
    const next = await tenantService.get(tenantId)
    setTenant(next)
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

  return { tenantId, tenant, loading, missing, reload }
}
