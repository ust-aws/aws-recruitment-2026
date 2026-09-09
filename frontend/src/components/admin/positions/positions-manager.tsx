"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/section-header"
import {
  MOCK_COMMITTEES,
  MOCK_POSITIONS,
  type Committee,
  type Position,
} from "@/components/admin/positions/mock-data"
import { CommitteeManager } from "@/components/admin/positions/committee-manager"
import { PositionList } from "@/components/admin/positions/position-list"
import { PositionDetail } from "@/components/admin/positions/position-detail"
import { PositionForm, type PositionFormMode } from "@/components/admin/positions/position-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type FormMode = PositionFormMode

const pageClasses =
  "mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 py-16"
const headerRowClasses = "flex flex-wrap items-end justify-between gap-4"
const headerStackClasses = "flex flex-col gap-3"
const headerActionsClasses = "flex flex-wrap gap-2"
const pathClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-prelude/70"
const layoutClasses = "grid gap-8 lg:grid-cols-2 lg:items-start"

export function PositionsManager() {
  const [committees, setCommittees] = useState<Committee[]>(MOCK_COMMITTEES)
  const [positions, setPositions] = useState<Position[]>(MOCK_POSITIONS)
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_POSITIONS[0]?.id ?? null
  )
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null)
  const [committeeManagerOpen, setCommitteeManagerOpen] = useState(false)

  const selected = positions.find((p) => p.id === selectedId) ?? null
  const selectedCommittee = committees.find(
    (c) => c.id === selected?.committeeId
  )

  function handleCreate(values: Omit<Position, "id">) {
    const created: Position = { ...values, id: crypto.randomUUID() }
    setPositions((prev) => [...prev, created])
    setSelectedId(created.id)
    setFormMode(null)
  }

  function handleUpdate(id: string, values: Omit<Position, "id">) {
    setPositions((prev) =>
      prev.map((position) =>
        position.id === id ? { ...position, ...values } : position
      )
    )
    setFormMode(null)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const deletedId = deleteTarget.id
    setPositions((prev) => prev.filter((p) => p.id !== deletedId))
    setSelectedId((current) => {
      if (current !== deletedId) return current
      return positions.find((p) => p.id !== deletedId)?.id ?? null
    })
    setDeleteTarget(null)
  }

  function handleCreateCommittee(values: Omit<Committee, "id">) {
    setCommittees((prev) => [...prev, { ...values, id: crypto.randomUUID() }])
  }

  function handleUpdateCommittee(id: string, values: Omit<Committee, "id">) {
    setCommittees((prev) =>
      prev.map((committee) =>
        committee.id === id ? { ...committee, ...values } : committee
      )
    )
  }

  function handleDeleteCommittee(id: string) {
    setCommittees((prev) => prev.filter((committee) => committee.id !== id))
  }

  return (
    <main className={pageClasses}>
      <div className={headerRowClasses}>
        <div className={headerStackClasses}>
          <p className={pathClasses}>/admin /hr</p>
          <SectionHeader
            eyebrow="// positions"
            title="Position management"
            subtitle="Open roles this cycle, grouped by committee. Select a position to see the full description on the right."
          />
        </div>
        <div className={headerActionsClasses}>
          <Button color="purple" onClick={() => setCommitteeManagerOpen(true)}>
            Manage committees
          </Button>
          <Button color="cyan" onClick={() => setFormMode({ type: "create" })}>
            New position
          </Button>
        </div>
      </div>

      <div className={layoutClasses}>
        <PositionList
          committees={committees}
          positions={positions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <PositionDetail
          position={selected}
          committee={selectedCommittee}
          onEdit={(position) => setFormMode({ type: "edit", position })}
          onDelete={setDeleteTarget}
        />
      </div>

      <CommitteeManager
        open={committeeManagerOpen}
        committees={committees}
        positions={positions}
        onOpenChange={setCommitteeManagerOpen}
        onCreate={handleCreateCommittee}
        onUpdate={handleUpdateCommittee}
        onDelete={handleDeleteCommittee}
      />

      {formMode ? (
        <PositionForm
          key={formMode.type === "edit" ? formMode.position.id : "create"}
          mode={formMode}
          committees={committees}
          onOpenChange={(open) => {
            if (!open) setFormMode(null)
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete position?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This will remove “${deleteTarget.name}” from the list. This cannot be undone in this session.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button color="purple" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
