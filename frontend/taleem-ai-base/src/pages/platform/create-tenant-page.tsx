import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { TenantFields } from '@/components/tenant-fields'
import { errorMessage } from '@/lib/auth'
import { createTenantPayload, emptyTenantDraft, validateTenantDraft } from '@/lib/tenant'
import { tenantService } from '@/services/platform'

export function CreateTenantPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyTenantDraft())
  const [busy, setBusy] = useState(false)

  async function submit() {
    const error = validateTenantDraft(draft, 'create')
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const created = await tenantService.create(createTenantPayload(draft))
      toast.success(`${created.displayName} was created`)
      navigate(`/platform/tenants/${created.id}`)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Tenants"
        title="Add tenant"
        description="Create the institution record first. Then assign a subscription with applications before inviting a tenant administrator."
        actions={
          <Button variant="outline" asChild>
            <Link to="/platform/tenants">
              <ArrowLeft />
              Back to tenants
            </Link>
          </Button>
        }
      />
      <div className="portal-card space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Institution</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            POST /tenant — legal name, display name, and institution type are required. New tenants start as
            ONBOARDING.
          </p>
        </div>
        <TenantFields mode="create" value={draft} onChange={setDraft} />
        <div className="flex justify-end">
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? 'Creating…' : 'Create tenant'}
          </Button>
        </div>
      </div>
    </div>
  )
}
