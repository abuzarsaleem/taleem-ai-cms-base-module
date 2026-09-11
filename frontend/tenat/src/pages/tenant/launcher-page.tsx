import { Link } from 'react-router-dom'
import { AppWindow, BadgeCheck, Building2, Image, Mail, MapPin, Settings2, Users } from 'lucide-react'
import { ApplicationIcon } from '@/components/application-icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { errorMessage } from '@/lib/auth'
import { oauthClientForApplication } from '@/lib/oauth-client-config'
import { silentLaunchApplication } from '@/lib/oauth'
import { useOwnTenant } from '@/lib/use-own-tenant'
import { toast } from 'sonner'
import { useState } from 'react'

const cards = [
  {
    to: '/tenant/profile',
    label: 'Profile',
    description: 'Legal name, display name, and institution identity.',
    action: 'Open profile',
    icon: Building2,
  },
  {
    to: '/tenant/application-access',
    label: 'Application access',
    description: 'See entitled applications and assign member access.',
    action: 'Manage access',
    icon: AppWindow,
  },
  {
    to: '/tenant/contacts',
    label: 'Contacts',
    description: 'People the platform and partners can reach.',
    action: 'Open contacts',
    icon: Users,
  },
  {
    to: '/tenant/addresses',
    label: 'Addresses',
    description: 'Registered and campus locations.',
    action: 'Open addresses',
    icon: MapPin,
  },
  {
    to: '/tenant/identifiers',
    label: 'Identifiers',
    description: 'Registration and accreditation numbers.',
    action: 'Open identifiers',
    icon: BadgeCheck,
  },
  {
    to: '/tenant/configuration',
    label: 'Configuration',
    description: 'Locale, timezone, currency, and branding.',
    action: 'Open configuration',
    icon: Settings2,
  },
  {
    to: '/tenant/smtp',
    label: 'SMTP',
    description: 'Outbound email host and secret reference.',
    action: 'Open SMTP',
    icon: Mail,
  },
  {
    to: '/tenant/assets',
    label: 'Assets',
    description: 'Logos, banners, and documents.',
    action: 'Open assets',
    icon: Image,
  },
]

export function TenantLauncherPage() {
  const { tenant, loading, missing } = useOwnTenant()
  const [launchBusy, setLaunchBusy] = useState<string | null>(null)

  async function openApplication(applicationCode: string, launchUrl?: string) {
    setLaunchBusy(applicationCode)
    try {
      if (oauthClientForApplication(applicationCode)) {
        await silentLaunchApplication({
          applicationCode,
          launchUrl,
          preferredTenantId: tenant?.id,
        })
        return
      }
      if (launchUrl) {
        window.open(launchUrl, '_blank', 'noopener,noreferrer')
        setLaunchBusy(null)
        return
      }
      toast.error('This application has no launch URL configured')
      setLaunchBusy(null)
    } catch (error) {
      toast.error(errorMessage(error))
      setLaunchBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="portal-card space-y-3 p-5">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (missing || !tenant) {
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
        description="Manage this institution. Subscriptions and tenant-administrator invitations are assigned by the platform."
      />
      <section className="space-y-3">
        <div>
          <h2 className="font-medium">Assigned applications</h2>
          <p className="text-sm text-muted-foreground">
            Applications assigned to this institution through an active subscription. Open uses each
            application’s launch URL.
          </p>
        </div>
        {tenant.applications?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tenant.applications.map((app) => {
              const oauth = oauthClientForApplication(app.applicationCode)
              const label = oauth?.label || app.name
              return (
                <div key={app.applicationId} className="portal-card p-5">
                  <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} />
                  <p className="mt-3 font-medium">{label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{app.applicationCode}</p>
                  {app.launchUrl ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">{app.launchUrl}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      disabled={launchBusy !== null || (!oauth && !app.launchUrl)}
                      onClick={() => void openApplication(app.applicationCode, app.launchUrl)}
                    >
                      {launchBusy === app.applicationCode ? 'Starting…' : `Open ${label}`}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={`/tenant/application-access/${app.applicationId}`}>Manage access</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No applications are assigned yet. A platform administrator must entitle applications through a
            subscription.
          </p>
        )}
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.to} className="portal-card p-5">
            <card.icon className="mb-3 size-5 text-accent" />
            <p className="font-medium">{card.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link to={card.to}>{card.action}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
