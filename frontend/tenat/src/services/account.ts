import { apiRequest, apiUpload } from '@/lib/api'
import type { AuthTokenResponse, UserProfile } from '@/lib/types'

export const authService = {
  login(email: string, password: string) {
    return apiRequest<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      token: null,
      body: { email, password },
    })
  },
  refresh(refreshToken: string) {
    return apiRequest<AuthTokenResponse>('/auth/refresh', {
      method: 'POST',
      token: null,
      body: { refreshToken },
    })
  },
  logout(refreshToken: string) {
    return apiRequest<{ loggedOut: boolean }>('/auth/logout', {
      method: 'POST',
      token: null,
      body: { refreshToken },
    })
  },
  acceptInvitation(body: { token: string; password: string; fullName: string }) {
    return apiRequest<AuthTokenResponse>('/auth/accept-invitation', {
      method: 'POST',
      token: null,
      body,
    })
  },
}

export const userProfileService = {
  get() {
    return apiRequest<UserProfile>('/user/me')
  },
  update(body: { fullName?: string; email?: string }) {
    return apiRequest<UserProfile>('/user/me', { method: 'PATCH', body })
  },
  uploadAvatar(file: File) {
    const data = new FormData()
    data.append('file', file)
    return apiUpload<UserProfile>('/user/me/avatar', data)
  },
  removeAvatar() {
    return apiRequest<UserProfile>('/user/me/avatar', { method: 'DELETE' })
  },
  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ changed: boolean; message: string }>('/user/me/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    })
  },
}
