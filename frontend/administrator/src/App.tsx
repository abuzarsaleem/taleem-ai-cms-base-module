import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/app-shell'
import { APP_HOME, APP_ROLE, roleFrom, useAuth } from '@/lib/auth'
import { LoginPage } from '@/pages/auth/login-page'
import { AccountPage } from '@/pages/account/account-page'
import { PlatformDashboardPage } from '@/pages/platform/dashboard-page'
import { TenantsPage } from '@/pages/platform/tenants-page'
import { CreateTenantPage } from '@/pages/platform/create-tenant-page'
import { TenantDetailPage } from '@/pages/platform/tenant-detail-page'
import { ApplicationsPage } from '@/pages/platform/applications-page'
import { ApplicationAccessPage } from '@/pages/platform/application-access-page'
import { PlatformContactsPage } from '@/pages/platform/contacts-page'
import { PlatformContactFormPage } from '@/pages/platform/contact-form-page'
import { PlatformAddressesPage } from '@/pages/platform/addresses-page'
import { PlatformAddressFormPage } from '@/pages/platform/address-form-page'
import { PlatformIdentifiersPage } from '@/pages/platform/identifiers-page'
import { PlatformIdentifierFormPage } from '@/pages/platform/identifier-form-page'
import { PlatformConfigurationPage } from '@/pages/platform/configuration-records-page'
import { PlatformConfigurationFormPage } from '@/pages/platform/configuration-form-page'
import { PlatformSmtpPage } from '@/pages/platform/smtp-page'
import { PlatformSmtpFormPage } from '@/pages/platform/smtp-form-page'
import { PlatformAssetsPage } from '@/pages/platform/assets-page'
import { PlatformAssetFormPage } from '@/pages/platform/asset-form-page'

function RequireAuth() {
  const { session, ready } = useAuth()
  if (!ready) return null
  if (!session) return <Navigate to="/login" replace />
  if (roleFrom(session) !== APP_ROLE) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/platform" element={<PlatformDashboardPage />} />
            <Route path="/platform/account" element={<AccountPage />} />
            <Route path="/platform/tenants" element={<TenantsPage />} />
            <Route path="/platform/tenants/new" element={<CreateTenantPage />} />
            <Route path="/platform/tenants/:tenantId" element={<TenantDetailPage />} />
            <Route path="/platform/applications" element={<ApplicationsPage />} />
            <Route path="/platform/applications/:applicationId" element={<ApplicationAccessPage />} />
            <Route path="/platform/contacts" element={<PlatformContactsPage />} />
            <Route path="/platform/contacts/new" element={<PlatformContactFormPage />} />
            <Route path="/platform/contacts/:tenantId/:id" element={<PlatformContactFormPage />} />
            <Route path="/platform/addresses" element={<PlatformAddressesPage />} />
            <Route path="/platform/addresses/new" element={<PlatformAddressFormPage />} />
            <Route path="/platform/addresses/:tenantId/:id" element={<PlatformAddressFormPage />} />
            <Route path="/platform/identifiers" element={<PlatformIdentifiersPage />} />
            <Route path="/platform/identifiers/new" element={<PlatformIdentifierFormPage />} />
            <Route path="/platform/identifiers/:tenantId/:id" element={<PlatformIdentifierFormPage />} />
            <Route path="/platform/configuration" element={<PlatformConfigurationPage />} />
            <Route path="/platform/configuration/new" element={<PlatformConfigurationFormPage />} />
            <Route path="/platform/configuration/:tenantId" element={<PlatformConfigurationFormPage />} />
            <Route path="/platform/smtp" element={<PlatformSmtpPage />} />
            <Route path="/platform/smtp/new" element={<PlatformSmtpFormPage />} />
            <Route path="/platform/smtp/:tenantId" element={<PlatformSmtpFormPage />} />
            <Route path="/platform/assets" element={<PlatformAssetsPage />} />
            <Route path="/platform/assets/new" element={<PlatformAssetFormPage />} />
            <Route path="/platform/assets/:tenantId/:id" element={<PlatformAssetFormPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={APP_HOME} replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TooltipProvider>
  )
}
