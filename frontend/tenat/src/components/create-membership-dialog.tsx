import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Field, FieldGrid } from '@/components/field'
import { errorMessage } from '@/lib/auth'
import {
  createMembershipPayload,
  validateCreateMembership,
  type CreateMembershipDraft,
} from '@/lib/membership'

const emptyDraft = (): CreateMembershipDraft => ({
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
})

export function CreateMembershipDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  onSubmit: (body: { email: string; password: string; fullName: string }) => Promise<void>
}) {
  const [draft, setDraft] = useState(emptyDraft)
  const [busy, setBusy] = useState(false)

  function reset() {
    setDraft(emptyDraft())
  }

  async function save() {
    const error = validateCreateMembership(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      await onSubmit(createMembershipPayload(draft))
      reset()
      onOpenChange(false)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) reset()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <FieldGrid>
            <Field label="Full name" required>
              <Input
                value={draft.fullName}
                autoComplete="name"
                maxLength={150}
                onChange={(e) => setDraft((current) => ({ ...current, fullName: e.target.value }))}
              />
            </Field>
            <Field label="Email" required>
              <Input
                type="email"
                value={draft.email}
                autoComplete="email"
                maxLength={255}
                onChange={(e) => setDraft((current) => ({ ...current, email: e.target.value }))}
              />
            </Field>
            <Field label="Password" required hint="At least 8 characters.">
              <Input
                type="password"
                value={draft.password}
                autoComplete="new-password"
                maxLength={128}
                onChange={(e) => setDraft((current) => ({ ...current, password: e.target.value }))}
              />
            </Field>
            <Field label="Confirm password" required>
              <Input
                type="password"
                value={draft.confirmPassword}
                autoComplete="new-password"
                maxLength={128}
                onChange={(e) => setDraft((current) => ({ ...current, confirmPassword: e.target.value }))}
              />
            </Field>
          </FieldGrid>
        </div>
        <DialogFooter>
          <Button
            disabled={
              busy ||
              !draft.fullName.trim() ||
              !draft.email.trim() ||
              !draft.password ||
              !draft.confirmPassword
            }
            onClick={() => void save()}
          >
            {busy ? 'Creating…' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
