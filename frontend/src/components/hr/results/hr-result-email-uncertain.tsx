"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { ResultEmailStatus } from "@/lib/api/client"
import { dashboardActionTargetClasses, dashboardRowTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const sectionClasses = "mt-5 border-t border-blue-chalk/15 pt-4"
const headingClasses = "font-sans text-sm font-semibold text-blue-chalk"
const helpClasses = "mt-1 font-sans text-xs leading-relaxed text-prelude"
const selectAllClasses = cn("mt-3 flex cursor-pointer items-center gap-3 px-1 font-sans text-sm text-blue-chalk", dashboardRowTargetClasses)
const listClasses = "mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto"
const itemClasses = cn("flex cursor-pointer items-start gap-3 rounded-[12px] bg-haiti/55 px-3 py-2", dashboardRowTargetClasses)
const recipientClasses = "font-sans text-sm text-blue-chalk"
const errorClasses = "mt-0.5 break-words font-mono text-[11px] text-prelude"
const actionsClasses = "mt-3 flex flex-wrap gap-2"
const actionClasses = cn("px-4", dashboardActionTargetClasses)

type Problem = ResultEmailStatus["problems"][number]

type UncertainProps = {
  problems: Problem[]
  busy: boolean
  onResend: (ids: string[]) => Promise<void>
  onMarkDelivered: (ids: string[]) => Promise<void>
}

/** Uncertain emails HR can tick: resend the ones missing from Sent, dismiss the ones found there. */
export function HrResultEmailUncertain({ problems, busy, onResend, onMarkDelivered }: UncertainProps) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  // Rows can leave the list while it is open, so only count ids still on it.
  const ids = problems.flatMap((problem) => (picked.has(problem.id) ? [problem.id] : []))
  const allPicked = ids.length === problems.length

  function toggle(id: string, on: boolean) {
    const next = new Set(picked)
    if (on) next.add(id)
    else next.delete(id)
    setPicked(next)
  }

  async function run(action: (ids: string[]) => Promise<void>) {
    await action(ids)
    setPicked(new Set())
  }

  return (
    <div className={sectionClasses}>
      <p className={headingClasses}>Uncertain</p>
      <p className={helpClasses}>
        Sending stopped partway, so these may already have been delivered. Search the sender
        account&apos;s Sent folder for each address, then tick the ones to resend (missing from Sent) or to
        mark as delivered (found in Sent).
      </p>
      <label className={selectAllClasses}>
        <Checkbox
          checked={allPicked}
          indeterminate={ids.length > 0 && !allPicked}
          onCheckedChange={(on) => setPicked(on ? new Set(problems.map((problem) => problem.id)) : new Set())}
        />
        Select all ({problems.length})
      </label>
      <ul className={listClasses}>
        {problems.map((problem) => (
          <li key={problem.id}>
            <label className={itemClasses}>
              <Checkbox checked={picked.has(problem.id)} onCheckedChange={(on) => toggle(problem.id, on)} />
              <span>
                <span className={recipientClasses}>{problem.recipient}</span>
                {problem.error ? <span className={cn(errorClasses, "block")}>{problem.error}</span> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className={actionsClasses}>
        <Button type="button" color="danger" className={actionClasses} disabled={busy || ids.length === 0} onClick={() => void run(onResend)}>
          {busy ? "Working…" : `Resend selected (${ids.length})`}
        </Button>
        <Button type="button" className={actionClasses} disabled={busy || ids.length === 0} onClick={() => void run(onMarkDelivered)}>
          Mark as delivered ({ids.length})
        </Button>
      </div>
    </div>
  )
}
