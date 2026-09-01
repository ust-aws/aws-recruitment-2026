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
import { ResponsibilityListField } from "@/components/admin/positions/responsibility-list-field"

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
  responsibilities: string[]
}

const emptyForm: FormState = {
  name: "",
  committeeId: "",
  description: "",
  responsibilities: [],
}

const committeePlaceholder = "Which committee does this position support?"
const fieldStackClasses = "flex flex-col gap-4"
const fieldClasses = "flex flex-col gap-2"
const errorListClasses =
  "flex list-disc flex-col gap-2 pl-4 font-sans text-sm text-prelude"

function collectValidationErrors(form: FormState): string[] {
  const errors: string[] = []

  if (!form.name.trim()) {
    errors.push("Title is required.")
  }

  if (!form.committeeId) {
    errors.push("Select which committee this position supports.")
  }

  if (!form.description.trim()) {
    errors.push("Description is required.")
  }

  const responsibilities = form.responsibilities
    .map((item) => item.trim())
    .filter(Boolean)

  if (responsibilities.length === 0) {
    errors.push("Add at least one responsibility.")
  }

  return errors
}

export function PositionForm({
  open,
  mode,
  committees,
  onOpenChange,
  onCreate,
  onUpdate,
}: PositionFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (!open || !mode) return
    setValidationErrors([])

    if (mode.type === "edit") {
      setForm({
        name: mode.position.name,
        committeeId: mode.position.committeeId,
        description: mode.position.description,
        responsibilities:
          mode.position.responsibilities.length > 0
            ? [...mode.position.responsibilities]
            : [""],
      })
      return
    }

    setForm({
      ...emptyForm,
      responsibilities: [""],
    })
  }, [open, mode, committees])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = collectValidationErrors(form)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    const responsibilities = form.responsibilities
      .map((item) => item.trim())
      .filter(Boolean)

    const values = {
      name: form.name.trim(),
      committeeId: form.committeeId,
      description: form.description.trim(),
      responsibilities,
    }

    if (mode?.type === "edit") {
      onUpdate(mode.position.id, values)
      return
    }
    onCreate(values)
  }

  const isEdit = mode?.type === "edit"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit position" : "New position"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this role’s details. Changing the committee moves it to that group."
                : "Add a role under a committee. All fields are required."}
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
              >
                <SelectTrigger id="position-committee" className="w-full">
                  <SelectValue placeholder={committeePlaceholder} />
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

            <ResponsibilityListField
              items={form.responsibilities}
              onChange={(responsibilities) =>
                setForm((f) => ({ ...f, responsibilities }))
              }
            />

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

      <Dialog
        open={validationErrors.length > 0}
        onOpenChange={(next) => {
          if (!next) setValidationErrors([])
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Missing requirements</DialogTitle>
            <DialogDescription>
              Complete the following before saving this position.
            </DialogDescription>
          </DialogHeader>
          <ul className={errorListClasses}>
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button color="cyan" onClick={() => setValidationErrors([])}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
