import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { TaskState, WorkTask } from "@/lib/hr/overview-tasks"
import { cn } from "@/lib/utils"

// Container query, not a viewport one: beside the 256px sidebar the panel is
// narrower than the screen, so the row switches on the panel's own width.
const itemClasses = "@container"
const rowClasses = "grid gap-3 px-5 py-4 @lg:grid-cols-[minmax(0,1fr)_auto] @lg:items-center @lg:gap-6"
const titleRowClasses = "flex flex-wrap items-center gap-x-3 gap-y-1"
const titleClasses = "font-sans text-sm font-semibold text-blue-chalk"
const detailClasses = "mt-1 font-sans text-sm leading-snug text-prelude"
const tagClasses = "rounded-pill border px-2.5 py-0.5 font-sans text-xs font-medium"
const tagByState: Record<TaskState, string | null> = {
  ready: null,
  blocked: "border-rose-glow/50 text-rose-glow",
  watch: "border-prelude/40 text-prelude",
}
const tagLabel: Record<TaskState, string> = { ready: "", blocked: "Blocked", watch: "Watching" }
const dotClasses = "size-2.5 shrink-0 rounded-full"
const buttonClasses = "h-11 w-full px-5 font-mono text-xs @lg:w-auto"

export function HrWorklistRow({ task }: { task: WorkTask }) {
  const tag = tagByState[task.state]
  return (
    <li className={itemClasses}>
      <div className={rowClasses}>
        <div className="min-w-0">
          <div className={titleRowClasses}>
            <span
              aria-hidden
              className={cn(dotClasses, task.primary ? "bg-aquamarine" : "bg-prelude/50")}
            />
            <h4 className={titleClasses}>{task.title}</h4>
            {tag ? <span className={cn(tagClasses, tag)}>{tagLabel[task.state]}</span> : null}
          </div>
          <p className={detailClasses}>{task.detail}</p>
        </div>
        <Button
          color={task.primary ? "cyan" : "purple"}
          className={buttonClasses}
          nativeButton={false}
          render={<Link href={task.href} />}
        >
          {task.actionLabel}
        </Button>
      </div>
    </li>
  )
}
