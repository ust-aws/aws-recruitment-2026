import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ResultsPreview } from "@/lib/api/client"

type Props = {
  open: boolean
  summary: ResultsPreview["summary"]
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function HrReleaseResultsDialog({
  open,
  summary,
  pending,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Release all results?</DialogTitle>
          <DialogDescription>
            This publishes {summary.pendingRelease} results, including {" "}
            {summary.accepted} accepted and {summary.rejected} rejected
            applicants. It will generate Member IDs and send personalized
            emails. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            color="purple"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            color="danger"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Releasing…" : "Release results"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
