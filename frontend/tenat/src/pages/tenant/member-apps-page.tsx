import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AppWindow, GraduationCap, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/page-header'
import { errorMessage, useAuth } from '@/lib/auth'
import { oauthClientForApplication } from '@/lib/oauth-client-config'
import { silentLaunchApplication } from '@/lib/oauth'
import { myApplicationsService, type MyApplication } from '@/services/my-applications'

function iconFor(code: string) {
  if (code === 'ALUMNI_ADMIN') return Shield
  if (code === 'ALUMNI') return GraduationCap
  return AppWindow
}

export function MemberAppsPage() {
  const { session } = useAuth()
  const [apps, setApps] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [autoLaunchAttempted, setAutoLaunchAttempted] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void myApplicationsService
      .listMine(session?.tenantId)
      .then(async (rows) => {
        if (cancelled) return
        setApps(rows)

        const launchable = rows.filter((app) =>
          oauthClientForApplication(app.applicationCode),
        )
        const target =
          launchable.find((app) => app.isDefault) ||
          (launchable.length === 1 ? launchable[0] : undefined)

        if (target && !autoLaunchAttempted) {
          setAutoLaunchAttempted(true)
          setBusyId(target.assignmentId)
          try {
            await silentLaunchApplication({
              applicationCode: target.applicationCode,
              launchUrl: target.launchUrl,
              preferredTenantId: target.tenantId || session?.tenantId,
            })
            return
          } catch (error) {
            if (!cancelled) {
              toast.error(errorMessage(error))
              setBusyId(null)
            }
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setApps([])
          toast.error(errorMessage(error))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session?.tenantId, autoLaunchAttempted])

  async function openApp(app: MyApplication) {
    setBusyId(app.assignmentId)
    try {
      await silentLaunchApplication({
        applicationCode: app.applicationCode,
        launchUrl: app.launchUrl,
        preferredTenantId: app.tenantId || session?.tenantId,
      })
    } catch (error) {
      toast.error(errorMessage(error))
      setBusyId(null)
    }
  }

  if (loading || busyId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">
          {busyId ? 'Opening your portal…' : 'Loading your applications…'}
        </p>
      </div>
    )
  }

  if (!apps.length) {
    return (
      <EmptyState
        title="No applications available"
        description="Ask your institution administrator to grant you access."
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Applications"
        title="Open your portal"
        description="Choose a portal to continue."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {apps.map((app) => {
          const Icon = iconFor(app.applicationCode)
          const oauth = oauthClientForApplication(app.applicationCode)
          const label = oauth?.label || app.applicationName
          const description = oauth?.description || app.roleName || app.roleCode
          return (
            <div key={app.assignmentId} className="portal-card p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <Icon className="size-5 text-accent" />
                {app.isDefault ? (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                    Default
                  </span>
                ) : null}
              </div>
              <p className="font-medium">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                {app.roleCode}
                {app.launchUrl ? ` · ${app.launchUrl}` : ''}
              </p>
              <Button
                className="mt-4"
                disabled={busyId !== null || !oauth}
                onClick={() => void openApp(app)}
              >
                {busyId === app.assignmentId ? 'Opening…' : `Open ${label}`}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
