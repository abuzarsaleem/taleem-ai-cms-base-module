import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Field, FieldGrid } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { useStore } from '@/lib/store'

export function TenantProfilePage() {
  const { store, setStore } = useStore()
  const tenant = store.tenants[0]
  const profile = store.profiles.find((row) => row.tenantId === tenant?.id)
  const contacts = store.contacts.filter((row) => row.tenantId === tenant?.id)
  const [displayName, setDisplayName] = useState(profile?.displayName ?? tenant?.displayName ?? '')
  const [website, setWebsite] = useState(profile?.website ?? tenant?.websiteUrl ?? '')
  const [addressLine1, setAddressLine1] = useState(profile?.addressLine1 ?? '')

  if (!tenant) return null

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Institution"
        title={tenant.displayName}
        description="Institution profile, contacts, and identifiers for this tenant only."
      />
      <Card className="portal-card">
        <CardHeader>
          <CardTitle>Institution profile</CardTitle>
          <CardDescription>Official identity used across common platform services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
            </Field>
          </FieldGrid>
          <Button
            onClick={() => {
              setStore((prev) => ({
                ...prev,
                tenants: prev.tenants.map((row) =>
                  row.id === tenant.id ? { ...row, displayName, websiteUrl: website } : row,
                ),
                profiles: prev.profiles.map((row) =>
                  row.tenantId === tenant.id ? { ...row, displayName, website, addressLine1 } : row,
                ),
              }))
              toast.success('Profile saved')
            }}
          >
            Save profile
          </Button>
        </CardContent>
      </Card>
      <Card className="portal-card">
        <CardHeader>
          <CardTitle>Key contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Primary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{`${contact.firstName} ${contact.lastName ?? ''}`.trim()}</TableCell>
                  <TableCell>{contact.designation ?? contact.contactType}</TableCell>
                  <TableCell>{contact.email ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge value={contact.isPrimary ? 'ACTIVE' : 'INACTIVE'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
