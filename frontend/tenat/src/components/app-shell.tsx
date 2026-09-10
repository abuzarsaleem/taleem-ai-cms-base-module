import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppWindow,
  BadgeCheck,
  Building2,
  Image,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Settings2,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { accountPathFor, roleFrom, roleLabelFor, useAuth } from '@/lib/auth'
import { cn, initialsFromName, isDisplayableImageUrl } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

type NavGroup = { label: string; items: NavItem[] }

const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/tenant', label: 'Launcher', icon: LayoutGrid, end: true },
      { to: '/tenant/apps', label: 'Alumni apps', icon: AppWindow },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/tenant/users', label: 'Members', icon: Users },
      { to: '/tenant/invitations', label: 'Invitations', icon: Mail },
      { to: '/tenant/application-access', label: 'Application access', icon: AppWindow },
    ],
  },
  {
    label: 'Institution',
    items: [{ to: '/tenant/profile', label: 'Profile', icon: Building2 }],
  },
  {
    label: 'Tenant configuration',
    items: [
      { to: '/tenant/contacts', label: 'Contacts', icon: UserRound },
      { to: '/tenant/addresses', label: 'Addresses', icon: MapPin },
      { to: '/tenant/identifiers', label: 'Identifiers', icon: BadgeCheck },
      { to: '/tenant/configuration', label: 'Configuration', icon: Settings2 },
      { to: '/tenant/smtp', label: 'SMTP', icon: Mail },
      { to: '/tenant/assets', label: 'Assets', icon: Image },
    ],
  },
]

const memberNav: NavGroup[] = [
  {
    label: 'Applications',
    items: [{ to: '/tenant/apps', label: 'Alumni apps', icon: AppWindow, end: true }],
  },
  {
    label: 'Account',
    items: [{ to: '/tenant/account', label: 'Your profile', icon: UserRound, end: true }],
  },
]

function isActive(pathname: string, item: NavItem, items: NavItem[]) {
  if (item.end) return pathname === item.to
  if (pathname !== item.to && !pathname.startsWith(`${item.to}/`)) return false
  return !items.some(
    (other) =>
      other.to !== item.to &&
      other.to.startsWith(`${item.to}/`) &&
      (pathname === other.to || pathname.startsWith(`${other.to}/`)),
  )
}

function crumbsFor(pathname: string) {
  const map: Record<string, string> = {
    '/tenant': 'Launcher',
    '/tenant/account': 'Account',
    '/tenant/users': 'Members',
    '/tenant/application-access': 'Application access',
    '/tenant/profile': 'Profile',
    '/tenant/contacts': 'Contacts',
    '/tenant/addresses': 'Addresses',
    '/tenant/identifiers': 'Identifiers',
    '/tenant/configuration': 'Configuration',
    '/tenant/smtp': 'SMTP',
    '/tenant/assets': 'Assets',
    '/tenant/invitations': 'Invitations',
  }
  if (map[pathname]) return map[pathname]
  if (pathname === '/oauth/consent') return 'Authorize'
  if (pathname === '/tenant/application-access/new') return 'Assign access'
  if (pathname.startsWith('/tenant/application-access/assignments/')) return 'Edit access'
  if (pathname.startsWith('/tenant/application-access/')) return 'Roles'
  if (pathname === '/tenant/contacts/new') return 'Add contact'
  if (pathname.startsWith('/tenant/contacts/')) return 'Edit contact'
  if (pathname === '/tenant/addresses/new') return 'Add address'
  if (pathname.startsWith('/tenant/addresses/')) return 'Edit address'
  if (pathname === '/tenant/identifiers/new') return 'Add identifier'
  if (pathname.startsWith('/tenant/identifiers/')) return 'Edit identifier'
  if (pathname === '/tenant/assets/new') return 'Add asset'
  if (pathname.startsWith('/tenant/assets/')) return 'Edit asset'
  return 'Workspace'
}

function SidebarNav({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[]
  pathname: string
  onNavigate?: () => void
}) {
  const items = groups.flatMap((group) => group.items)

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.label} className="pt-2">
          <p className="px-3 pt-2 pb-2 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/55 uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item, items)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-sidebar-foreground/80',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    active &&
                      'bg-sidebar-accent text-white shadow-[inset_3px_0_0_0_var(--sidebar-primary)] hover:bg-sidebar-accent hover:text-white',
                  )}
                >
                  <item.icon className={cn('size-4', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/70')} />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarBody({
  groups,
  pathname,
  name,
  roleLabel,
  initials,
  avatarUrl,
  accountPath,
  onNavigate,
  onSignOut,
}: {
  groups: NavGroup[]
  pathname: string
  name: string
  roleLabel: string
  initials: string
  avatarUrl?: string
  accountPath: string
  onNavigate?: () => void
  onSignOut: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col px-3.5 py-5">
      <NavLink
        to={groups[0]?.items[0]?.to ?? '/'}
        end
        className="mb-4 flex shrink-0 items-center justify-center outline-none"
        onClick={onNavigate}
      >
        <span className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm">
          <BrandLogo className="h-12" />
        </span>
      </NavLink>
      <SidebarNav groups={groups} pathname={pathname} onNavigate={onNavigate} />
      <div className="mt-auto shrink-0 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white/8 p-2.5">
          <NavLink
            to={accountPath}
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-2.5 outline-none"
          >
            <Avatar className="size-9 overflow-hidden rounded-full">
              {isDisplayableImageUrl(avatarUrl) ? (
                <img src={avatarUrl} alt={name} className="size-full rounded-full object-cover" />
              ) : (
                <AvatarFallback className="rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">{roleLabel}</p>
            </div>
          </NavLink>
          <button
            type="button"
            className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
            aria-label="Log out"
            onClick={onSignOut}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  if (!session) return null

  const role = roleFrom(session)
  const groups = role === 'TENANT_ADMIN' ? adminNav : memberNav
  const roleLabel = roleLabelFor(role)
  const initials = initialsFromName(session.user.fullName)
  const accountPath = accountPathFor()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const sidebar = (
    <SidebarBody
      groups={groups}
      pathname={location.pathname}
      name={session.user.fullName}
      roleLabel={roleLabel}
      initials={initials}
      avatarUrl={session.user.avatarUrl}
      accountPath={accountPath}
      onNavigate={() => setMobileOpen(false)}
      onSignOut={handleSignOut}
    />
  )

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <aside className="portal-sidebar hidden h-full w-[248px] shrink-0 text-sidebar-foreground md:flex">
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-[72px] shrink-0 items-center gap-3 border-b border-border bg-background/92 px-4 backdrop-blur-xl sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
          <div className="min-w-0 text-sm">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {role === 'TENANT_MEMBER' ? 'Member' : 'Institution'}
            </p>
            <p className="truncate font-medium">{crumbsFor(location.pathname)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar size="sm" className="overflow-hidden">
                    {isDisplayableImageUrl(session.user.avatarUrl) ? (
                      <img
                        src={session.user.avatarUrl}
                        alt={session.user.fullName}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback>{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium">{session.user.fullName}</span>
                    <span className="block text-xs text-muted-foreground">{session.user.email}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(accountPath)}>
                  <UserRound className="size-4" />
                  Your profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="mx-auto flex w-full min-w-0 max-w-[1500px] flex-col px-4 pt-8 pb-10 sm:px-8 sm:pt-10">
            <Outlet />
          </main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-[248px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="portal-sidebar h-full text-sidebar-foreground">{sidebar}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
