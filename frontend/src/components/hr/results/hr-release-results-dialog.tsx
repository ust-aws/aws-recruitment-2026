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
            applicants. It will send personalized result emails. Member IDs
            are generated only after payment verification. This cannot be undone.
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
            color="cyan"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Releasing…" : "Release Results"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
