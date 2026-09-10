import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/app-shell'
import { APP_ACCOUNT, APP_HOME, canUseTenantApp, roleFrom, useAuth } from '@/lib/auth'
import { LoginPage } from '@/pages/auth/login-page'
import { OAuthAuthorizePage } from '@/pages/auth/oauth-authorize-page'
import { OAuthConsentPage } from '@/pages/auth/oauth-consent-page'
import { AcceptInvitationPage } from '@/pages/auth/accept-invitation-page'
import { AccountPage } from '@/pages/account/account-page'
import { MemberAppsPage } from '@/pages/tenant/member-apps-page'
import { TenantLauncherPage } from '@/pages/tenant/launcher-page'
import { TenantUsersPage } from '@/pages/tenant/users-page'
import { TenantProfilePage } from '@/pages/tenant/profile-page'
import { TenantContactsPage } from '@/pages/tenant/contacts-page'
import { TenantContactFormPage } from '@/pages/tenant/contact-form-page'
import { TenantAddressesPage } from '@/pages/tenant/addresses-page'
import { TenantAddressFormPage } from '@/pages/tenant/address-form-page'
import { TenantIdentifiersPage } from '@/pages/tenant/identifiers-page'
import { TenantIdentifierFormPage } from '@/pages/tenant/identifier-form-page'
import { TenantConfigurationPage } from '@/pages/tenant/configuration-page'
import { TenantSmtpPage } from '@/pages/tenant/smtp-page'
import { TenantAssetsPage } from '@/pages/tenant/assets-page'
import { TenantAssetFormPage } from '@/pages/tenant/asset-form-page'
import { TenantMemberInvitationsPage } from '@/pages/tenant/member-invitations-page'
import { TenantApplicationAccessPage } from '@/pages/tenant/application-access-page'
import { TenantApplicationAccessAppPage } from '@/pages/tenant/application-access-app-page'
import { TenantApplicationAccessFormPage } from '@/pages/tenant/application-access-form-page'

function RequireAuth() {
  const { session, ready } = useAuth()
  if (!ready) return null
  if (!session) return <Navigate to="/login" replace />
  if (!canUseTenantApp(roleFrom(session))) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireTenantAdmin() {
  const { session } = useAuth()
  if (roleFrom(session) !== 'TENANT_ADMIN') return <Navigate to={APP_ACCOUNT} replace />
  return <Outlet />
}

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
        <Route path="/oauth/consent" element={<OAuthConsentPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/accept-invite" element={<AcceptInvitationPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/tenant/account" element={<AccountPage />} />
            <Route path="/tenant/apps" element={<MemberAppsPage />} />
            <Route element={<RequireTenantAdmin />}>
              <Route path="/tenant" element={<TenantLauncherPage />} />
              <Route path="/tenant/users" element={<TenantUsersPage />} />
              <Route path="/tenant/application-access" element={<TenantApplicationAccessPage />} />
              <Route path="/tenant/application-access/new" element={<TenantApplicationAccessFormPage />} />
              <Route
                path="/tenant/application-access/assignments/:assignmentId"
                element={<TenantApplicationAccessFormPage />}
              />
              <Route path="/tenant/application-access/:applicationId" element={<TenantApplicationAccessAppPage />} />
              <Route path="/tenant/profile" element={<TenantProfilePage />} />
              <Route path="/tenant/contacts" element={<TenantContactsPage />} />
              <Route path="/tenant/contacts/new" element={<TenantContactFormPage />} />
              <Route path="/tenant/contacts/:id" element={<TenantContactFormPage />} />
              <Route path="/tenant/addresses" element={<TenantAddressesPage />} />
              <Route path="/tenant/addresses/new" element={<TenantAddressFormPage />} />
              <Route path="/tenant/addresses/:id" element={<TenantAddressFormPage />} />
              <Route path="/tenant/identifiers" element={<TenantIdentifiersPage />} />
              <Route path="/tenant/identifiers/new" element={<TenantIdentifierFormPage />} />
              <Route path="/tenant/identifiers/:id" element={<TenantIdentifierFormPage />} />
              <Route path="/tenant/configuration" element={<TenantConfigurationPage />} />
              <Route path="/tenant/smtp" element={<TenantSmtpPage />} />
              <Route path="/tenant/assets" element={<TenantAssetsPage />} />
              <Route path="/tenant/assets/new" element={<TenantAssetFormPage />} />
              <Route path="/tenant/assets/:id" element={<TenantAssetFormPage />} />
              <Route path="/tenant/invitations" element={<TenantMemberInvitationsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={APP_HOME} replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TooltipProvider>
  )
}
