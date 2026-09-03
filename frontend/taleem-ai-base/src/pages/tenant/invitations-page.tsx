import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'

export function TenantInvitationsPage() {
  const { session } = useAuth()
  const { store } = useStore()
  const invitations = store.invitations.filter((row) => row.email === session?.user.email)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Invitations"
        description="Tenant administrator invitations for this institution."
      />
      <div className="portal-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Invited by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <StatusBadge value={row.status} />
                </TableCell>
                <TableCell>{row.expiresAt}</TableCell>
                <TableCell>{row.invitedBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
