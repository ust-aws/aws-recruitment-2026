"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Committee } from "@/components/admin/positions/mock-data"

export type CommitteeFormMode =
  | { type: "create" }
  | { type: "edit"; committee: Committee }

type CommitteeFormProps = {
  mode: CommitteeFormMode
  onOpenChange: (open: boolean) => void
  onCreate: (values: Omit<Committee, "id">) => void
  onUpdate: (id: string, values: Omit<Committee, "id">) => void
}

type FormState = {
  name: string
  description: string
}

const emptyForm: FormState = { name: "", description: "" }
const fieldStackClasses = "flex flex-col gap-4"
const fieldClasses = "flex flex-col gap-2"

function formStateFromMode(mode: CommitteeFormMode): FormState {
  if (mode.type === "edit") {
    return {
      name: mode.committee.name,
      description: mode.committee.description,
    }
  }
  return emptyForm
}

export function CommitteeForm({
  mode,
  onOpenChange,
  onCreate,
  onUpdate,
}: CommitteeFormProps) {
  const [form, setForm] = useState(() => formStateFromMode(mode))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) return

    const values = {
      name,
      description: form.description.trim(),
    }

    if (mode.type === "edit") {
      onUpdate(mode.committee.id, values)
      return
    }
    onCreate(values)
  }

  const isEdit = mode.type === "edit"

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit committee" : "New committee"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the committee name and description."
              : "Add a committee group for organizing positions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={fieldStackClasses}>
          <div className={fieldClasses}>
            <Label htmlFor="committee-name">Name</Label>
            <Input
              id="committee-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Sponsorship"
              required
            />
          </div>

          <div className={fieldClasses}>
            <Label htmlFor="committee-description">Description</Label>
            <Textarea
              id="committee-description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What this committee handles"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              color="purple"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" color="cyan">
              {isEdit ? "Save changes" : "Create committee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
