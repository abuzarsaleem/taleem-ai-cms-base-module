import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { Field, FieldGrid } from '@/components/field'
import { EmptyState, PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/section-title'
import { errorMessage } from '@/lib/auth'
import { createMembershipPayload, validateCreateMembership, type CreateMembershipDraft } from '@/lib/membership'
import { EMAIL_PATTERN } from '@/lib/utils'
import { useOwnTenant } from '@/lib/use-own-tenant'
import { MembershipRole, type ApplicationRole, type TenantMembership } from '@/lib/types'
import {
  applicationAccessService,
  invitationService,
  memberInvitationService,
  membershipService,
} from '@/services/platform'

type ProvisionMode = 'invite' | 'password'

type AppAssignmentDraft = {
  enabled: boolean
  roleId: string
}

const emptyPasswordDraft = (): CreateMembershipDraft => ({
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
})

export function TenantCreateMemberPage() {
  const navigate = useNavigate()
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const [step, setStep] = useState<1 | 2>(1)
  const [provisionMode, setProvisionMode] = useState<ProvisionMode>('password')
  const [tenantRole, setTenantRole] = useState<string>(MembershipRole.TENANT_MEMBER)
  const [passwordDraft, setPasswordDraft] = useState(emptyPasswordDraft)
  const [inviteEmail, setInviteEmail] = useState('')
  const [members, setMembers] = useState<TenantMembership[]>([])
  const [rolesByApp, setRolesByApp] = useState<Record<string, ApplicationRole[]>>({})
  const [assignments, setAssignments] = useState<Record<string, AppAssignmentDraft>>({})
  const [primaryApplicationId, setPrimaryApplicationId] = useState('')
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [busy, setBusy] = useState(false)

  const applications = tenant?.applications ?? []

  const reloadMembers = useCallback(async () => {
    if (!tenantId) return
    const page = await membershipService.list(tenantId)
    setMembers(page.data)
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) {
      setLoadingMembers(false)
      return
    }
    setLoadingMembers(true)
    reloadMembers()
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoadingMembers(false))
  }, [reloadMembers, tenantId])

  useEffect(() => {
    if (step !== 2 || !tenantId || !applications.length) return
    let cancelled = false
    setLoadingRoles(true)
    Promise.all(
      applications.map(async (app) => {
        const roles = await applicationAccessService.roles(tenantId, app.applicationCode)
        return [app.applicationId, roles] as const
      }),
    )
      .then((entries) => {
        if (cancelled) return
        const nextRoles: Record<string, ApplicationRole[]> = Object.fromEntries(entries)
        setRolesByApp(nextRoles)
        setAssignments((current) => {
          const next: Record<string, AppAssignmentDraft> = { ...current }
          for (const app of applications) {
            if (!next[app.applicationId]) {
              const defaultRole = nextRoles[app.applicationId]?.[0]
              next[app.applicationId] = { enabled: false, roleId: defaultRole?.id ?? '' }
            }
          }
          return next
        })
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => {
        if (!cancelled) setLoadingRoles(false)
      })
    return () => {
      cancelled = true
    }
  }, [applications, step, tenantId])

  const enabledApps = useMemo(
    () => applications.filter((app) => assignments[app.applicationId]?.enabled),
    [applications, assignments],
  )

  useEffect(() => {
    if (!enabledApps.length) {
      setPrimaryApplicationId('')
      return
    }
    if (!enabledApps.some((app) => app.applicationId === primaryApplicationId)) {
      setPrimaryApplicationId(enabledApps[0].applicationId)
    }
  }, [enabledApps, primaryApplicationId])

  function emailInUse(email: string) {
    const normalized = email.trim().toLowerCase()
    return members.some((row) => row.userEmail.toLowerCase() === normalized)
  }

  function validateStep1() {
    if (provisionMode === 'invite') {
      const email = inviteEmail.trim()
      if (!email) return 'Email is required'
      if (email.length > 255) return 'Email must be 255 characters or fewer'
      if (!EMAIL_PATTERN.test(email)) return 'Email must be a valid address'
      if (emailInUse(email)) return 'A member with this email already exists'
      return null
    }
    const error = validateCreateMembership(passwordDraft)
    if (error) return error
    if (emailInUse(passwordDraft.email)) return 'A member with this email already exists'
    return null
  }

  async function sendInvite() {
    const error = validateStep1()
    if (error) {
      toast.error(error)
      return
    }
    if (!tenantId) return
    setBusy(true)
    try {
      const email = inviteEmail.trim().toLowerCase()
      if (tenantRole === MembershipRole.TENANT_ADMIN) {
        await invitationService.create(tenantId, email)
      } else {
        await memberInvitationService.create(tenantId, email)
      }
      toast.success('Invitation sent. Assign application access after they accept.')
      navigate('/tenant/users')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function createMemberWithAccess(skipApps: boolean) {
    const error = validateStep1()
    if (error) {
      toast.error(error)
      return
    }
    if (!tenantId) return

    if (!skipApps) {
      for (const app of enabledApps) {
        const draft = assignments[app.applicationId]
        if (!draft?.roleId) {
          toast.error(`Choose a role for ${app.name}`)
          return
        }
      }
    }

    setBusy(true)
    try {
      const created = await membershipService.create(tenantId, createMembershipPayload(passwordDraft))
      if (tenantRole === MembershipRole.TENANT_ADMIN) {
        await membershipService.update(tenantId, created.id, { isTenantAdmin: true })
      }
      if (!skipApps) {
        for (const app of enabledApps) {
          const draft = assignments[app.applicationId]
          await applicationAccessService.create(tenantId, {
            userId: created.userId,
            applicationId: app.applicationId,
            roleId: draft.roleId,
            isDefault: app.applicationId === primaryApplicationId,
          })
        }
      }
      toast.success(skipApps ? 'Member created' : 'Member created with application access')
      navigate(`/tenant/users/${created.id}`)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  function goToStep2() {
    const error = validateStep1()
    if (error) {
      toast.error(error)
      return
    }
    setStep(2)
  }

  if (tenantLoading || loadingMembers) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenant || !tenantId) {
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
        title="Add member"
        description={
          step === 1
            ? 'Create an account with a password or send an email invitation. Application access can be assigned now for password accounts, or after an invite is accepted.'
            : 'Choose which entitled applications this member can access and their role on each.'
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/tenant/users">
              <ArrowLeft />
              Back to members
            </Link>
          </Button>
        }
        toolbar={
          <p className="text-sm text-muted-foreground">
            Step {step} of {provisionMode === 'invite' ? 1 : 2}
          </p>
        }
      />

      {step === 1 ? (
        <div className="portal-card space-y-6 p-5 sm:p-6">
          <SectionTitle
            title="How should they join?"
            description="Invitations are email-only. Password accounts can sign in immediately and optionally receive app access in the next step."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`rounded-xl border p-4 text-left transition-colors ${
                provisionMode === 'password'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
              onClick={() => setProvisionMode('password')}
            >
              <div className="flex items-center gap-2 font-medium">
                <UserPlus className="size-4" />
                Set password
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Create the account now. You can assign applications on the next step.
              </p>
            </button>
            <button
              type="button"
              className={`rounded-xl border p-4 text-left transition-colors ${
                provisionMode === 'invite'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
              onClick={() => setProvisionMode('invite')}
            >
              <div className="flex items-center gap-2 font-medium">
                <Mail className="size-4" />
                Send invitation
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Email a link to join. Application access can be assigned after they accept.
              </p>
            </button>
          </div>

          <FieldGrid>
            {provisionMode === 'password' ? (
              <>
                <Field label="Full name" required>
                  <Input
                    value={passwordDraft.fullName}
                    autoComplete="name"
                    maxLength={150}
                    onChange={(e) => setPasswordDraft((current) => ({ ...current, fullName: e.target.value }))}
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={passwordDraft.email}
                    autoComplete="email"
                    maxLength={255}
                    onChange={(e) => setPasswordDraft((current) => ({ ...current, email: e.target.value }))}
                  />
                </Field>
                <Field label="Password" required hint="At least 8 characters.">
                  <Input
                    type="password"
                    value={passwordDraft.password}
                    autoComplete="new-password"
                    maxLength={128}
                    onChange={(e) => setPasswordDraft((current) => ({ ...current, password: e.target.value }))}
                  />
                </Field>
                <Field label="Confirm password" required>
                  <Input
                    type="password"
                    value={passwordDraft.confirmPassword}
                    autoComplete="new-password"
                    maxLength={128}
                    onChange={(e) =>
                      setPasswordDraft((current) => ({ ...current, confirmPassword: e.target.value }))
                    }
                  />
                </Field>
              </>
            ) : (
              <Field label="Email" required>
                <Input
                  type="email"
                  value={inviteEmail}
                  autoComplete="email"
                  maxLength={255}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </Field>
            )}
            <Field label="Tenant role" required>
              <Select value={tenantRole} onValueChange={setTenantRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MembershipRole.TENANT_MEMBER}>Tenant member</SelectItem>
                  <SelectItem value={MembershipRole.TENANT_ADMIN}>Tenant administrator</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGrid>

          {provisionMode === 'invite' ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Invited users must accept before you can assign application access. They will appear in the members
              list once their account is active.
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {provisionMode === 'invite' ? (
              <Button disabled={busy} onClick={() => void sendInvite()}>
                {busy ? 'Sending…' : 'Send invitation'}
              </Button>
            ) : (
              <>
                <Button variant="outline" disabled={busy} onClick={() => void createMemberWithAccess(true)}>
                  {busy ? 'Creating…' : 'Create without apps'}
                </Button>
                {applications.length ? (
                  <Button disabled={busy} onClick={goToStep2}>
                    Continue to app access
                  </Button>
                ) : (
                  <Button disabled={busy} onClick={() => void createMemberWithAccess(true)}>
                    {busy ? 'Creating…' : 'Create member'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="portal-card space-y-6 p-5 sm:p-6">
          <SectionTitle
            title="Application access"
            description="Select entitled applications and a role for each. You can change these later from the member profile."
          />

          {loadingRoles ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : !applications.length ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No applications are entitled for this institution yet.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const draft = assignments[app.applicationId] ?? { enabled: false, roleId: '' }
                const roles = rolesByApp[app.applicationId] ?? []
                return (
                  <div
                    key={app.applicationId}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-background/70 p-4 sm:flex-row sm:items-center"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={draft.enabled}
                        onCheckedChange={(checked) =>
                          setAssignments((current) => ({
                            ...current,
                            [app.applicationId]: {
                              ...draft,
                              enabled: checked === true,
                              roleId: draft.roleId || roles[0]?.id || '',
                            },
                          }))
                        }
                      />
                      <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium">{app.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
                      </div>
                    </label>
                    <Select
                      value={draft.roleId || undefined}
                      disabled={!draft.enabled || !roles.length}
                      onValueChange={(roleId) =>
                        setAssignments((current) => ({
                          ...current,
                          [app.applicationId]: { ...draft, roleId },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder={roles.length ? 'Select role' : 'No roles'} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.roleName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          )}

          {enabledApps.length ? (
            <Field label="Primary landing application">
              <Select value={primaryApplicationId || undefined} onValueChange={setPrimaryApplicationId}>
                <SelectTrigger className="w-full sm:max-w-md">
                  <SelectValue placeholder="Choose primary app" />
                </SelectTrigger>
                <SelectContent>
                  {enabledApps.map((app) => (
                    <SelectItem key={app.applicationId} value={app.applicationId}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={busy} onClick={() => void createMemberWithAccess(true)}>
                Skip for now
              </Button>
              <Button disabled={busy} onClick={() => void createMemberWithAccess(false)}>
                {busy ? 'Creating…' : 'Create member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
