import { useState } from 'react'
import { toast } from 'sonner'
import { GraduationCap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { errorMessage, useAuth } from '@/lib/auth'
import { ALUMNI_PORTAL_TARGETS, type AlumniPortalTarget } from '@/lib/oauth-client-config'
import { silentLaunchAlumniPortal } from '@/lib/oauth'

const TARGET_META: Record<AlumniPortalTarget, { icon: typeof GraduationCap }> = {
  alumni: { icon: GraduationCap },
  admin: { icon: Shield },
}

export function MemberAppsPage() {
  const { session } = useAuth()
  const [busy, setBusy] = useState<AlumniPortalTarget | null>(null)

  async function openPortal(target: AlumniPortalTarget) {
    setBusy(target)
    try {
      await silentLaunchAlumniPortal(target, session?.tenantId)
    } catch (error) {
      toast.error(errorMessage(error))
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Applications"
        title="Open your Alumni apps"
        description="Choose a portal to open. Access is authorized automatically with your tenant account."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(ALUMNI_PORTAL_TARGETS) as AlumniPortalTarget[]).map((target) => {
          const cfg = ALUMNI_PORTAL_TARGETS[target]
          const Icon = TARGET_META[target].icon
          return (
            <div key={target} className="portal-card p-5">
              <Icon className="mb-3 size-5 text-accent" />
              <p className="font-medium">{cfg.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{cfg.description}</p>
              <Button
                className="mt-4"
                disabled={busy !== null}
                onClick={() => void openPortal(target)}
              >
                {busy === target ? 'Opening…' : `Open ${cfg.label}`}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
