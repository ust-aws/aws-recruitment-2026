"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Committee, Position } from "@/components/admin/positions/mock-data"
import {
  CommitteeForm,
  type CommitteeFormMode,
} from "@/components/admin/positions/committee-form"

type CommitteeManagerProps = {
  open: boolean
  committees: Committee[]
  positions: Position[]
  onOpenChange: (open: boolean) => void
  onCreate: (values: Omit<Committee, "id">) => void
  onUpdate: (id: string, values: Omit<Committee, "id">) => void
  onDelete: (id: string) => void
}

const listClasses = "flex flex-col gap-3"
const rowClasses =
  "glass flex flex-wrap items-start justify-between gap-3 rounded-[14px] border border-blue-chalk/15 bg-meteorite/55 p-4"
const nameClasses = "font-sans text-sm font-semibold text-blue-chalk"
const descriptionClasses = "mt-1 font-sans text-sm text-prelude"
const actionsClasses = "flex flex-wrap gap-2"
const errorClasses = "font-sans text-sm text-destructive"

export function CommitteeManager({
  open,
  committees,
  positions,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
}: CommitteeManagerProps) {
  const [formMode, setFormMode] = useState<CommitteeFormMode | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function positionCount(committeeId: string) {
    return positions.filter((p) => p.committeeId === committeeId).length
  }

  function handleDelete(committee: Committee) {
    const count = positionCount(committee.id)
    if (count > 0) {
      setDeleteError(
        `Remove or reassign ${count} position${count === 1 ? "" : "s"} before deleting “${committee.name}”.`
      )
      return
    }
    setDeleteError(null)
    onDelete(committee.id)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setDeleteError(null)
          onOpenChange(next)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage committees</DialogTitle>
            <DialogDescription>
              Add, edit, or remove committee groups. A committee with positions
              cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Button color="cyan" onClick={() => setFormMode({ type: "create" })}>
              New committee
            </Button>

            {deleteError ? <p className={errorClasses}>{deleteError}</p> : null}

            <div className={listClasses}>
              {committees.map((committee) => (
                <div key={committee.id} className={rowClasses}>
                  <div className="min-w-0 flex-1">
                    <p className={nameClasses}>{committee.name}</p>
                    <p className={descriptionClasses}>
                      {committee.description || "No description."}
                    </p>
                  </div>
                  <div className={actionsClasses}>
                    <Button
                      color="purple"
                      size="sm"
                      onClick={() =>
                        setFormMode({ type: "edit", committee })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => handleDelete(committee)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {formMode ? (
        <CommitteeForm
          key={
            formMode.type === "edit" ? formMode.committee.id : "create"
          }
          mode={formMode}
          onOpenChange={(next) => {
            if (!next) setFormMode(null)
          }}
          onCreate={(values) => {
            onCreate(values)
            setFormMode(null)
          }}
          onUpdate={(id, values) => {
            onUpdate(id, values)
            setFormMode(null)
          }}
        />
      ) : null}
    </>
  )
}
