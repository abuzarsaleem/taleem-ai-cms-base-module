import { APP_MEMBER_APPS } from '@/lib/auth'
import { silentLaunchApplication } from '@/lib/oauth'
import { oauthClientForApplication } from '@/lib/oauth-client-config'
import { myApplicationsService, type MyApplication } from '@/services/my-applications'

/**
 * After member login: open default app, or the only assigned app, via launch URL.
 * Only show the chooser when the member has multiple non-default options.
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

  const launchable = apps.filter((app) =>
    oauthClientForApplication(app.applicationCode),
  )
  const target =
    launchable.find((app) => app.isDefault) ||
    (launchable.length === 1 ? launchable[0] : undefined)

  if (target) {
    await silentLaunchApplication({
      applicationCode: target.applicationCode,
      launchUrl: target.launchUrl,
      preferredTenantId: target.tenantId || tenantId || undefined,
    })
    return { path: APP_MEMBER_APPS, launched: true }
  }

  return { path: APP_MEMBER_APPS, launched: false }
}
