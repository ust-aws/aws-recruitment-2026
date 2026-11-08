import { HrWorklistRow } from "@/components/hr/overview/hr-worklist-row"
import type { WorkTask } from "@/lib/hr/overview-tasks"
import {
  dashboardDividerClasses,
  dashboardPanelClasses,
} from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const headingClasses = "font-sans text-lg font-semibold text-blue-chalk"
const listClasses = cn(dashboardPanelClasses, dashboardDividerClasses, "mt-4 overflow-hidden")
const calmClasses = cn(dashboardPanelClasses, "mt-4 px-5 py-5 font-sans text-base text-prelude")

export function HrWorklist({ tasks }: { tasks: WorkTask[] }) {
  return (
    <section aria-labelledby="worklist-heading">
      <h3 id="worklist-heading" className={headingClasses}>
        Worklist
      </h3>
      {tasks.length === 0 ? (
        <p className={calmClasses}>Nothing is waiting on an officer right now.</p>
      ) : (
        <ul className={listClasses}>
          {tasks.map((task) => (
            <HrWorklistRow key={task.key} task={task} />
          ))}
        </ul>
      )}
    </section>
  )
}
