"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/section-header"
import {
  MOCK_COMMITTEES,
  MOCK_POSITIONS,
  type Position,
} from "@/components/admin/positions/mock-data"
import { PositionList } from "@/components/admin/positions/position-list"
import { PositionDetail } from "@/components/admin/positions/position-detail"
import { PositionForm } from "@/components/admin/positions/position-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type FormMode = { type: "create" } | { type: "edit"; position: Position }

const pageClasses =
  "mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 py-16"
const headerRowClasses = "flex flex-wrap items-end justify-between gap-4"
const headerStackClasses = "flex flex-col gap-3"
const pathClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-prelude/70"
const layoutClasses = "grid gap-8 lg:grid-cols-2 lg:items-start"
const deleteButtonClasses =
  "border-blue-chalk/20 bg-transparent text-prelude hover:bg-haiti/50 hover:text-blue-chalk"

export function PositionsManager() {
  const [positions, setPositions] = useState<Position[]>(MOCK_POSITIONS)
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_POSITIONS[0]?.id ?? null
  )
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null)

  const selected = positions.find((p) => p.id === selectedId) ?? null
  const selectedCommittee = MOCK_COMMITTEES.find(
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
        <Button color="cyan" onClick={() => setFormMode({ type: "create" })}>
          New position
        </Button>
      </div>

      <div className={layoutClasses}>
        <PositionList
          committees={MOCK_COMMITTEES}
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

      <PositionForm
        open={formMode !== null}
        mode={formMode}
        committees={MOCK_COMMITTEES}
        onOpenChange={(open) => {
          if (!open) setFormMode(null)
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

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
              color="purple"
              className={deleteButtonClasses}
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
