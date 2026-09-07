import { Link } from 'react-router-dom'
import { BadgeCheck, Building2, Image, Mail, MapPin, Settings2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { useOwnTenant } from '@/lib/use-own-tenant'

const cards = [
  {
    to: '/tenant/profile',
    label: 'Profile',
    description: 'Legal name, display name, and institution identity.',
    action: 'Open profile',
    icon: Building2,
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

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-40 rounded-[var(--radius)]" />
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.to} className="portal-card p-5">
            <card.icon className="mb-3 size-5 text-[#00c2b2]" />
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
