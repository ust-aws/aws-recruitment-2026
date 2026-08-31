"use client"

import { useEffect, useState, type FormEvent } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Committee, Position } from "@/components/admin/positions/mock-data"

type FormMode = { type: "create" } | { type: "edit"; position: Position }

type PositionFormProps = {
  open: boolean
  mode: FormMode | null
  committees: Committee[]
  onOpenChange: (open: boolean) => void
  onCreate: (values: Omit<Position, "id">) => void
  onUpdate: (id: string, values: Omit<Position, "id">) => void
}

type FormState = {
  name: string
  committeeId: string
  description: string
  responsibilities: string
}

const emptyForm: FormState = {
  name: "",
  committeeId: "",
  description: "",
  responsibilities: "",
}

const fieldStackClasses = "flex flex-col gap-4"
const fieldClasses = "flex flex-col gap-2"

export function PositionForm({
  open,
  mode,
  committees,
  onOpenChange,
  onCreate,
  onUpdate,
}: PositionFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!open || !mode) return
    if (mode.type === "edit") {
      setForm({
        name: mode.position.name,
        committeeId: mode.position.committeeId,
        description: mode.position.description,
        responsibilities: mode.position.responsibilities,
      })
      return
    }
    setForm({
      ...emptyForm,
      committeeId: committees[0]?.id ?? "",
    })
  }, [open, mode, committees])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name || !form.committeeId) return

    const values = {
      name,
      committeeId: form.committeeId,
      description: form.description.trim(),
      responsibilities: form.responsibilities.trim(),
    }

    if (mode?.type === "edit") {
      onUpdate(mode.position.id, values)
      return
    }
    onCreate(values)
  }

  const isEdit = mode?.type === "edit"
  const selectedCommittee = committees.find((c) => c.id === form.committeeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit position" : "New position"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this role’s details. Changing the committee moves it to that group."
              : "Add a role under a committee. Title and committee are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={fieldStackClasses}>
          <div className={fieldClasses}>
            <Label htmlFor="position-title">Title</Label>
            <Input
              id="position-title"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Web Developer"
              required
            />
          </div>

          <div className={fieldClasses}>
            <Label htmlFor="position-committee">Committee</Label>
            <Select
              value={form.committeeId || null}
              onValueChange={(committeeId) => {
                if (committeeId == null) return
                setForm((f) => ({ ...f, committeeId }))
              }}
              required
            >
              <SelectTrigger id="position-committee" className="w-full">
                <SelectValue placeholder="Select a committee">
                  {selectedCommittee?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {committees.map((committee) => (
                  <SelectItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={fieldClasses}>
            <Label htmlFor="position-description">Description</Label>
            <Textarea
              id="position-description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Short summary of the role"
            />
          </div>

          <div className={fieldClasses}>
            <Label htmlFor="position-responsibilities">Responsibilities</Label>
            <Textarea
              id="position-responsibilities"
              value={form.responsibilities}
              onChange={(e) =>
                setForm((f) => ({ ...f, responsibilities: e.target.value }))
              }
              placeholder="What this role owns day to day"
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
              {isEdit ? "Save changes" : "Create position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
