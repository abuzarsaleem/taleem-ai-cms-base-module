import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
          <DropdownMenuItem onClick={() => void run(() => tenantService.suspend(tenant.id), 'Tenant suspended')}>
            Suspend
          </DropdownMenuItem>
        ) : null}
        {actions.canRetire ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void run(() => tenantService.retire(tenant.id), 'Tenant retired')}
          >
            Retire
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
