import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { EntitlementStatus } from '@/lib/types'

export function TenantLauncherPage() {
  const { session } = useAuth()
  const { store } = useStore()
  const tenant = store.tenants[0]
  const user = store.users.find((row) => row.email === session?.user.email)
  const entitled = store.entitlements.filter(
    (row) => row.tenantId === tenant?.id && row.status === EntitlementStatus.ACTIVE,
  )
  const assigned = entitled.filter((row) => user?.assignedApps.includes(row.applicationCode ?? ''))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="BWF-004"
        title="Application launcher"
        description={`${tenant?.displayName ?? 'Your institution'} — only entitled and assigned applications are shown.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assigned.map((row) => {
          const app = store.applications.find((item) => item.applicationCode === row.applicationCode)
          if (!app) return null
          return (
            <Card key={row.id} className="portal-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{app.name}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </div>
                  <StatusBadge value="ACTIVE" />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{app.applicationCode}</p>
                <Button asChild>
                  <a href={app.launchUrl ?? '#'} target="_blank" rel="noreferrer">
                    Open
                    <ExternalLink />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {!assigned.length ? (
        <p className="text-sm text-muted-foreground">No applications are assigned to this user yet.</p>
      ) : null}
    </div>
  )
}
