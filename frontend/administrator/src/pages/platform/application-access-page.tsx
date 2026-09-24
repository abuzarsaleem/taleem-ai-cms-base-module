import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationRolesDrawer } from '@/components/application-roles-drawer'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import type { CatalogApplication } from '@/lib/types'
import { applicationService } from '@/services/platform'

/** Deep-link entry: opens the roles drawer for an application, then returns to the catalogue. */
export function ApplicationAccessPage() {
  const { applicationId = '' } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<CatalogApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!applicationId) {
      setMissing(true)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    applicationService
      .get(applicationId)
      .then((result) => {
        if (!cancelled) setApp(result)
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) setMissing(true)
        else toast.error(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applicationId])

  if (!applicationId || missing) {
    return <Navigate to="/platform/applications" replace />
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-36 rounded-3xl opacity-40" />
        <Skeleton className="h-72 rounded-xl opacity-40" />
      </div>
      <ApplicationRolesDrawer
        open={Boolean(app)}
        onOpenChange={(open) => {
          if (!open) navigate('/platform/applications', { replace: true })
        }}
        application={app}
      />
    </>
  )
}
