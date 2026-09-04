import { Button } from '@/components/ui/button'

export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button size="sm" variant="outline" onClick={onDelete}>
        Remove
      </Button>
    </div>
  )
}
