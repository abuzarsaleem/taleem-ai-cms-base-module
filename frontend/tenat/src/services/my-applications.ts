import { apiRequest } from '@/lib/api'

export type MyApplication = {
  assignmentId: string
  tenantId: string
  applicationId: string
  applicationCode: string
  applicationName: string
  launchUrl?: string
  logoUrl?: string
  roleId: string
  roleCode: string
  roleName?: string
  isDefault: boolean
  status: string
}

export const myApplicationsService = {
  listMine(tenantId?: string | null) {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
    return apiRequest<MyApplication[]>(`/user/me/applications${query}`)
  },
}
