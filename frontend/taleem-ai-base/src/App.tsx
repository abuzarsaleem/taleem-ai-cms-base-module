import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/app-shell'
import { homeFor, roleFrom, useAuth } from '@/lib/auth'
import type { Role } from '@/lib/types'
import { LoginPage } from '@/pages/auth/login-page'
import { AcceptInvitationPage } from '@/pages/auth/accept-invitation-page'
import { PlatformDashboardPage } from '@/pages/platform/dashboard-page'
import { TenantsPage } from '@/pages/platform/tenants-page'
import { CreateTenantPage } from '@/pages/platform/create-tenant-page'
import { TenantDetailPage } from '@/pages/platform/tenant-detail-page'
import { ApplicationsPage } from '@/pages/platform/applications-page'
import { TenantLauncherPage } from '@/pages/tenant/launcher-page'
import { TenantUsersPage } from '@/pages/tenant/users-page'
import { TenantProfilePage } from '@/pages/tenant/profile-page'
import { TenantConfigurationPage } from '@/pages/tenant/configuration-page'
import { TenantMemberInvitationsPage } from '@/pages/tenant/member-invitations-page'

function RequireAuth({ role }: { role: Role }) {
  const { session, ready } = useAuth()
  if (!ready) return null
  if (!session) return <Navigate to="/login" replace />
  const current = roleFrom(session)
  if (!current) return <Navigate to="/login" replace />
  if (current !== role) return <Navigate to={homeFor(current)} replace />
  return <Outlet />
}

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

        <Route element={<RequireAuth role="PLATFORM_ADMIN" />}>
          <Route element={<AppShell />}>
            <Route path="/platform" element={<PlatformDashboardPage />} />
            <Route path="/platform/tenants" element={<TenantsPage />} />
            <Route path="/platform/tenants/new" element={<CreateTenantPage />} />
            <Route path="/platform/tenants/:tenantId" element={<TenantDetailPage />} />
            <Route path="/platform/applications" element={<ApplicationsPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth role="TENANT_ADMIN" />}>
          <Route element={<AppShell />}>
            <Route path="/tenant" element={<TenantLauncherPage />} />
            <Route path="/tenant/users" element={<TenantUsersPage />} />
            <Route path="/tenant/profile" element={<TenantProfilePage />} />
            <Route path="/tenant/configuration" element={<TenantConfigurationPage />} />
            <Route path="/tenant/invitations" element={<TenantMemberInvitationsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TooltipProvider>
  )
}
