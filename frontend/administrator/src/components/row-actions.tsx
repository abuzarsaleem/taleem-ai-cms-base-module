import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function RowActions({
  onEdit,
  editTo,
  onDelete,
}: {
  onEdit?: () => void
  editTo?: string
  onDelete: () => void
}) {
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
      <Button size="sm" variant="outline" onClick={onDelete}>
        Remove
      </Button>
    </div>
  )
}
