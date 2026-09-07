import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { errorMessage } from '@/lib/auth'
import { lifecycleFor } from '@/lib/tenant'
import type { Tenant } from '@/lib/types'
import { tenantService } from '@/services/platform'

export function TenantLifecycleMenu({
  tenant,
  onChanged,
}: {
  tenant: Tenant
  onChanged: () => void
}) {
  const actions = lifecycleFor(tenant.status)
  const [pending, setPending] = useState(false)
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    success: string
    run: () => Promise<unknown>
  } | null>(null)

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      toast.success(success)
      onChanged()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${tenant.displayName}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/platform/tenants/${tenant.id}`}>View</Link>
          </DropdownMenuItem>
          {actions.canActivate || actions.canSuspend || actions.canRetire ? <DropdownMenuSeparator /> : null}
          {actions.canActivate ? (
            <DropdownMenuItem onClick={() => void run(() => tenantService.activate(tenant.id), 'Tenant activated')}>
              Activate
            </DropdownMenuItem>
          ) : null}
          {actions.canSuspend ? (
            <DropdownMenuItem
              onClick={() =>
                setConfirm({
                  title: `Suspend ${tenant.displayName}?`,
                  description: 'The institution will be unavailable until it is activated again.',
                  confirmLabel: 'Suspend',
                  success: 'Tenant suspended',
                  run: () => tenantService.suspend(tenant.id),
                })
              }
            >
              Suspend
            </DropdownMenuItem>
          ) : null}
          {actions.canRetire ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                setConfirm({
                  title: `Retire ${tenant.displayName}?`,
                  description: 'The institution will be retired and no longer active on the platform.',
                  confirmLabel: 'Retire',
                  success: 'Tenant retired',
                  run: () => tenantService.retire(tenant.id),
                })
              }
            >
              Retire
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel}
        pending={pending}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
        onConfirm={async () => {
          if (!confirm) return
          setPending(true)
          try {
            await confirm.run()
            toast.success(confirm.success)
            setConfirm(null)
            onChanged()
          } catch (error) {
            toast.error(errorMessage(error))
          } finally {
            setPending(false)
          }
        }}
      />
    </>
  )
}
