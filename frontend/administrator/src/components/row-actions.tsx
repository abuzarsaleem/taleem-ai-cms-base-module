import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function RowActions({
  onEdit,
  editTo,
  onDelete,
  deleteTitle = 'Remove this record?',
  deleteDescription = 'This cannot be undone.',
  deleteLabel = 'Remove',
}: {
  onEdit?: () => void
  editTo?: string
  onDelete: () => void | Promise<unknown>
  deleteTitle?: string
  deleteDescription?: string
  deleteLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <div className="flex justify-end gap-2">
      {editTo ? (
        <Button size="sm" variant="outline" asChild>
          <Link to={editTo}>Edit</Link>
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <ConfirmDialog
        open={open}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel={deleteLabel}
        pending={pending}
        onOpenChange={setOpen}
        onConfirm={async () => {
          setPending(true)
          try {
            await onDelete()
            setOpen(false)
          } finally {
            setPending(false)
          }
        }}
      />
    </div>
  )
}
