import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'

/** OAuth starts after sign-in — send any authorize entry to login. */
export function OAuthAuthorizePage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Skeleton className="h-40 w-full max-w-md rounded-[var(--radius)]" />
    </div>
  )
}
