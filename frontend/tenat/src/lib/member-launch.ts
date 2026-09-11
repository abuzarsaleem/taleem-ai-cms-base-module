import { APP_MEMBER_APPS } from '@/lib/auth'
import { silentLaunchApplication } from '@/lib/oauth'
import { oauthClientForApplication } from '@/lib/oauth-client-config'
import { myApplicationsService, type MyApplication } from '@/services/my-applications'

/**
 * After member login: if a default application is assigned, open it via launch URL.
 * Otherwise return the apps chooser path.
 */
export async function resolveMemberPostLoginPath(
  tenantId?: string | null,
): Promise<{ path: string; launched: boolean }> {
  let apps: MyApplication[] = []
  try {
    apps = await myApplicationsService.listMine(tenantId)
  } catch {
    return { path: APP_MEMBER_APPS, launched: false }
  }

  const defaultApp = apps.find((app) => app.isDefault)
  if (defaultApp && oauthClientForApplication(defaultApp.applicationCode)) {
    await silentLaunchApplication({
      applicationCode: defaultApp.applicationCode,
      launchUrl: defaultApp.launchUrl,
      preferredTenantId: defaultApp.tenantId || tenantId || undefined,
    })
    return { path: APP_MEMBER_APPS, launched: true }
  }

  return { path: APP_MEMBER_APPS, launched: false }
}
