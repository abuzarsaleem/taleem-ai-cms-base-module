import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { applyTenantBranding, clearTenantBranding, type TenantBrandColors } from '@/lib/branding'
import { tenantConfigurationService } from '@/services/platform'
import { useTheme } from '@/theme/theme-provider'

type BrandingContextValue = {
  apply: (colors: TenantBrandColors) => void
  reload: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

function fromConfig(row: TenantBrandColors): TenantBrandColors {
  return {
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    accentColor: row.accentColor,
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()
  const { theme } = useTheme()
  const tenantId = session?.tenantId
  const [colors, setColors] = useState<TenantBrandColors | null>(null)

  const apply = useCallback((next: TenantBrandColors) => {
    setColors(fromConfig(next))
  }, [])

  const reload = useCallback(async () => {
    if (!tenantId) {
      setColors(null)
      return
    }
    try {
      const configuration = await tenantConfigurationService.get(tenantId)
      setColors(fromConfig(configuration))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setColors(null)
      else setColors(null)
    }
  }, [tenantId])

  useEffect(() => {
    if (!ready) return
    let cancelled = false

    if (!tenantId) {
      setColors(null)
      return
    }

    tenantConfigurationService
      .get(tenantId)
      .then((configuration) => {
        if (!cancelled) setColors(fromConfig(configuration))
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) setColors(null)
        else setColors(null)
      })

    return () => {
      cancelled = true
    }
  }, [ready, tenantId])

  useLayoutEffect(() => {
    if (!colors) {
      clearTenantBranding()
      return
    }
    applyTenantBranding(colors, theme)
  }, [colors, theme])

  useEffect(() => () => clearTenantBranding(), [])

  const value = useMemo(() => ({ apply, reload }), [apply, reload])

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider')
  return ctx
}
