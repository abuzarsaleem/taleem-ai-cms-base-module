import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/auth'
import type { Tenant } from '@/lib/types'
import { tenantService } from '@/services/platform'

export function usePlatformTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    tenantService
      .list(1, 50)
      .then(async (first) => {
        const pages = Math.max(1, first.meta.totalPages || Math.ceil(first.meta.total / 50) || 1)
        const rest =
          pages > 1
            ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) => tenantService.list(index + 2, 50)))
            : []
        if (cancelled) return
        setTenants([...first.data, ...rest.flatMap((page) => page.data)])
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { tenants, loading }
}
