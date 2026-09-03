import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Field } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { createId } from '@/lib/ids'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { EntitlementStatus, TenantUserRole, UserStatus } from '@/lib/types'

export function TenantUsersPage() {
  const { session } = useAuth()
  const { store, setStore, addAudit } = useStore()
  const tenantId = store.tenants[0]?.id ?? ''
  const entitled = store.entitlements
    .filter((row) => row.tenantId === tenantId && row.status === EntitlementStatus.ACTIVE)
    .map((row) => row.applicationCode)
    .filter((code): code is string => Boolean(code))
  const users = store.users.filter((row) => row.tenantId === tenantId)
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<(typeof TenantUserRole)[keyof typeof TenantUserRole]>(
    TenantUserRole.TENANT_USER,
  )
  const [apps, setApps] = useState<string[]>([])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="BWF-002"
        title="Tenant users"
        description="Invite users with a central identity. Application assignment cannot exceed tenant entitlement."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Invite user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite user</DialogTitle>
                <DialogDescription>Existing platform identities would be reused when APIs are connected.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field label="Full name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Role">
                  <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TenantUserRole.TENANT_ADMIN}>Tenant administrator</SelectItem>
                      <SelectItem value={TenantUserRole.TENANT_USER}>Tenant user</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Assigned applications</p>
                  {entitled.map((code) => (
                    <label key={code} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={apps.includes(code)}
                        onCheckedChange={() =>
                          setApps((prev) => (prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]))
                        }
                      />
                      {code}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!fullName || !email.includes('@')) {
                      toast.error('Name and email are required')
                      return
                    }
                    const blocked = apps.filter((code) => !entitled.includes(code))
                    if (blocked.length) {
                      toast.error('Assignment cannot exceed entitlement')
                      return
                    }
                    setStore((prev) => ({
                      ...prev,
                      users: [
                        ...prev.users,
                        {
                          id: createId('usr'),
                          tenantId,
                          fullName,
                          email,
                          role,
                          status: UserStatus.INVITED,
                          assignedApps: apps,
                        },
                      ],
                    }))
                    addAudit({
                      tenantName: store.tenants.find((t) => t.id === tenantId)?.displayName,
                      actor: session?.user.fullName ?? 'Tenant Admin',
                      action: 'USER_INVITED',
                      entity: `user / ${email}`,
                    })
                    setOpen(false)
                    setFullName('')
                    setEmail('')
                    setApps([])
                    toast.success('Invitation created')
                  }}
                >
                  Send invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="portal-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>{user.role.replaceAll('_', ' ')}</TableCell>
                <TableCell>{user.assignedApps.join(', ') || '—'}</TableCell>
                <TableCell>
                  <StatusBadge value={user.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
