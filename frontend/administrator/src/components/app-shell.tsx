import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  CreditCard,
  Gauge,
  Image,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { accountPathFor, useAuth } from '@/lib/auth'
import { cn, initialsFromName, isDisplayableImageUrl } from '@/lib/utils'

type NavItem = {
  to?: string
  label: string
  icon: LucideIcon
  end?: boolean
  soon?: boolean
}

type NavGroup = { label: string; items: NavItem[] }

const nav: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/platform', label: 'Dashboard', icon: Gauge, end: true }],
  },
  {
    label: 'Institutions',
    items: [{ to: '/platform/tenants', label: 'Tenants', icon: Building2 }],
  },
  {
    label: 'Applications',
    items: [
      { to: '/platform/applications', label: 'Applications', icon: LayoutGrid },
      { to: '/platform/subscriptions', label: 'Subscription Management', icon: CreditCard },
      { to: '/platform/users', label: 'Users Management', icon: Users },
      { to: '/platform/oauth-clients', label: 'OAuth Clients', icon: Lock },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/platform/configuration', label: 'Configurations', icon: Settings2 },
      { to: '/platform/contacts', label: 'Contacts', icon: Users },
      { to: '/platform/addresses', label: 'Addresses', icon: MapPin },
      { to: '/platform/identifiers', label: 'Identifiers', icon: BadgeCheck },
      { to: '/platform/smtp', label: 'SMTP', icon: Mail },
      { to: '/platform/assets', label: 'Assets', icon: Image },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Logs', icon: Activity, soon: true },
      { label: 'Notifications', icon: Bell, soon: true },
      { label: 'System Health', icon: ShieldCheck, soon: true },
    ],
  },
]

function isActive(pathname: string, item: NavItem, items: NavItem[]) {
  if (!item.to) return false
  if (item.end) return pathname === item.to
  if (pathname !== item.to && !pathname.startsWith(`${item.to}/`)) return false
  return !items.some(
    (other) =>
      other.to &&
      other.to !== item.to &&
      other.to.startsWith(`${item.to}/`) &&
      (pathname === other.to || pathname.startsWith(`${other.to}/`)),
  )
}

function navDestinations(groups: NavGroup[]) {
  return groups.flatMap((group) =>
    group.items
      .filter((item): item is NavItem & { to: string } => Boolean(item.to) && !item.soon)
      .map((item) => ({
        to: item.to,
        label: item.label,
        group: group.label,
        icon: item.icon,
      })),
  )
}

function HeaderNavSearch({ groups }: { groups: NavGroup[] }) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const destinations = useMemo(() => navDestinations(groups), [groups])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return destinations
    return destinations.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.to.toLowerCase().includes(q),
    )
  }, [destinations, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function goTo(to: string) {
    navigate(to)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative mx-auto hidden w-full max-w-md lg:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-9 rounded-full border-border bg-background pl-9 text-sm"
        placeholder="Search navigation..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
            return
          }
          if (!filtered.length) return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex((current) => (current + 1) % filtered.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex((current) => (current - 1 + filtered.length) % filtered.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            const item = filtered[activeIndex]
            if (item) goTo(item.to)
          }
        }}
      />
      {open ? (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-72 overflow-y-auto p-1">
            {filtered.length ? (
              filtered.map((item, index) => (
                <button
                  key={item.to}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    index === activeIndex && 'bg-accent/80',
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(item.to)}
                >
                  <item.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.group}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching pages</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function crumbsFor(pathname: string) {
  const map: Record<string, string> = {
    '/platform': 'Dashboard',
    '/platform/tenants': 'Tenants',
    '/platform/tenants/new': 'Add tenant',
    '/platform/applications': 'Applications',
    '/platform/subscriptions': 'Subscription Management',
    '/platform/users': 'Users Management',
    '/platform/oauth-clients': 'OAuth clients',
    '/platform/contacts': 'Contacts',
    '/platform/addresses': 'Addresses',
    '/platform/identifiers': 'Identifiers',
    '/platform/configuration': 'Configurations',
    '/platform/smtp': 'SMTP',
    '/platform/assets': 'Assets',
    '/platform/account': 'Account',
  }
  if (map[pathname]) return map[pathname]
  if (pathname === '/platform/contacts/new') return 'Add contact'
  if (pathname.startsWith('/platform/contacts/')) return 'Edit contact'
  if (pathname === '/platform/addresses/new') return 'Add address'
  if (pathname.startsWith('/platform/addresses/')) return 'Edit address'
  if (pathname === '/platform/identifiers/new') return 'Add identifier'
  if (pathname.startsWith('/platform/identifiers/')) return 'Edit identifier'
  if (pathname === '/platform/configuration/new') return 'Configure tenant'
  if (pathname.startsWith('/platform/configuration/')) return 'Configure tenant'
  if (pathname === '/platform/smtp/new') return 'Add SMTP'
  if (pathname.startsWith('/platform/smtp/')) return 'Edit SMTP'
  if (pathname === '/platform/assets/new') return 'Add asset'
  if (pathname.startsWith('/platform/assets/')) return 'Edit asset'
  if (pathname.startsWith('/platform/applications/')) return 'Roles & permissions'
  if (pathname.startsWith('/platform/tenants/')) return 'Tenant'
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
    <nav className="portal-sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      {groups.map((group) => (
        <div key={group.label} className="pt-2 first:pt-0">
          <p className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-sidebar-foreground/40 uppercase">
            {group.label}
          </p>
          <div className="flex flex-col">
            {group.items.map((item) => {
              const active = isActive(pathname, item, items)
              if (!item.to || item.soon) {
                return (
                  <span
                    key={item.label}
                    className="mx-2 flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/40"
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                )
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={cn(
                    'relative mx-2 flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75',
                    'hover:bg-white/8 hover:text-white',
                    active &&
                      'bg-white/10 text-white hover:bg-white/10 hover:text-white before:absolute before:top-1/2 before:left-0 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[#00c2b2]',
                  )}
                >
                  <item.icon className={cn('size-4 shrink-0', active ? 'text-[#00c2b2]' : 'text-sidebar-foreground/55')} />
                  <span className="truncate">{item.label}</span>
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <NavLink
        to={groups[0]?.items[0]?.to ?? '/'}
        end
        className="mb-2 flex shrink-0 items-center gap-2.5 px-4 pt-3.5 pb-2 outline-none"
        onClick={onNavigate}
      >
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10 text-white">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Taleem AI</p>
          <p className="truncate text-[10px] tracking-[0.12em] text-sidebar-foreground/50 uppercase">CMS Platform</p>
        </div>
      </NavLink>

      <SidebarNav groups={groups} pathname={pathname} onNavigate={onNavigate} />

      <div className="shrink-0 space-y-2 border-t border-sidebar-border px-3 py-3">
        <div className="rounded-lg bg-white/6 p-2.5">
          <NavLink
            to={accountPath}
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5 outline-none"
          >
            <Avatar className="size-9 overflow-hidden rounded-full">
              {isDisplayableImageUrl(avatarUrl) ? (
                <img src={avatarUrl} alt={name} className="size-full rounded-full object-cover" />
              ) : (
                <AvatarFallback className="rounded-full bg-sidebar-primary text-[11px] font-semibold text-white">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          </NavLink>
          <div className="mt-2 space-y-0.5 border-t border-sidebar-border pt-2">
            <NavLink
              to={accountPath}
              onClick={onNavigate}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs text-sidebar-foreground/70 hover:bg-white/8 hover:text-white"
            >
              <UserRound className="size-3.5" />
              Profile
            </NavLink>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs text-red-300 hover:bg-white/8"
              onClick={onSignOut}
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
        <p className="px-1 text-[10px] text-sidebar-foreground/35">Taleem AI CMS · v1.0.0</p>
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

  const groups = nav
  const roleLabel = 'Platform administrator'
  const initials = initialsFromName(session.user.fullName)
  const accountPath = accountPathFor()
  const crumb = crumbsFor(location.pathname)

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
      <aside className="portal-sidebar hidden h-full w-[248px] shrink-0 flex-col overflow-hidden text-sidebar-foreground md:flex">
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-topbar z-20 flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-card px-5 sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mr-1 h-4 md:hidden" />
          <div className="hidden min-w-0 text-sm md:block">
            <p className="text-muted-foreground">
              Platform <span className="mx-1 text-border">/</span>{' '}
              <span className="font-medium text-foreground">{crumb}</span>
            </p>
          </div>
          <HeaderNavSearch groups={groups} />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                3
              </span>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2.5 px-1.5">
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
                    <span className="block text-sm font-medium leading-tight">{session.user.fullName}</span>
                    <span className="block text-xs leading-tight text-muted-foreground">{roleLabel}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
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
          <main className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col px-5 py-5 sm:px-6">
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
