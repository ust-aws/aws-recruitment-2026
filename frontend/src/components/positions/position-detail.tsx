import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Position } from "@/lib/positions"
import { isAssistantRole, openSpots } from "@/lib/positions"

const articleClasses =
  "flex min-h-0 max-h-[min(72vh,46rem)] flex-col border-blue-chalk/15"
const bodyClasses =
  "panel-scroll flex flex-1 flex-col gap-6 overflow-y-auto p-6 text-left"
const detailIntroClasses = "flex flex-col gap-3 items-start"
const committeeClasses =
  "font-mono text-xs uppercase tracking-wide text-aquamarine"
const titleClasses = "font-sans text-3xl font-bold leading-tight text-blue-chalk"
const pillClasses =
  "w-fit rounded-pill border border-biloba-flower/35 bg-daisy-bush/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue-chalk"
const assistantPillClasses =
  "border-aquamarine/40 bg-aquamarine/15 text-aquamarine"
const metaRowClasses = "flex flex-wrap items-center justify-start gap-2"
const sectionClasses = "flex flex-col gap-2 items-start"
const copyClasses = "font-sans text-sm leading-relaxed text-prelude"
const labelClasses =
  "font-mono text-[11px] uppercase tracking-wide text-aquamarine"
const dutyRowClasses = "flex gap-3 font-sans text-sm leading-relaxed text-prelude"
const dutyIndexClasses = "w-6 shrink-0 font-mono text-xs text-aquamarine"
const footerClasses =
  "flex shrink-0 flex-col items-start gap-4 border-t border-blue-chalk/15 bg-haiti/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
const footerHintClasses = "font-mono text-xs text-prelude text-left"
const applyLinkClasses =
  "glass inline-flex w-fit items-center justify-center rounded-[14px] border border-aquamarine/40 bg-aquamarine/85 px-5 py-3 font-mono text-sm text-haiti transition-shadow hover:bg-aquamarine/95 hover:shadow-[0_0_24px_rgba(90,240,192,0.45)]"

const closedHintClasses = "font-mono text-xs text-prelude"

type PositionDetailProps = {
  position: Position
  applicationsOpen?: boolean
}

export function PositionDetail({
  position,
  applicationsOpen = true,
}: PositionDetailProps) {
  const assistant = isAssistantRole(position)
  const spots = openSpots(position)
  const showApplyAction = position.isOpen && applicationsOpen

  return (
    <article className={articleClasses}>
      <div key={position.id} className="reveal flex min-h-0 flex-1 flex-col">
        <div className={bodyClasses}>
          <div className={detailIntroClasses}>
            <p className={committeeClasses}>{position.committee}</p>
            <h1 className={titleClasses}>{position.title}</h1>
            <div className={metaRowClasses}>
              <span className={cn(pillClasses, assistant && assistantPillClasses)}>
                {assistant ? "executive assistant" : "committee staff"}
              </span>
              <span className={cn(pillClasses, assistantPillClasses)}>
                {position.isOpen
                  ? `${spots} ${spots === 1 ? "spot" : "spots"} available`
                  : "not open"}
              </span>
            </div>
          </div>

          <section className={sectionClasses}>
            <h2 className={labelClasses}>{"// committee"}</h2>
            <p className={copyClasses}>{position.committeeDescription}</p>
          </section>

          <section className={sectionClasses}>
            <h2 className={labelClasses}>{"// role"}</h2>
            <p className={copyClasses}>{position.description}</p>
          </section>

          <section className={`${sectionClasses} gap-3`}>
            <h2 className={labelClasses}>{"// responsibilities"}</h2>
            <ol className="flex w-full flex-col gap-2.5 text-left">
              {position.responsibilities.map((duty, index) => (
                <li key={duty} className={dutyRowClasses}>
                  <span className={dutyIndexClasses}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{duty}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className={footerClasses}>
          <p className={footerHintClasses}>
            {showApplyAction
              ? "Ready to ship with us?"
              : !applicationsOpen
                ? "Applications are not open yet."
                : "This role is part of the org chart but is not accepting applications."}
          </p>
          {showApplyAction ? (
            <Link
              href={`/apply/form?position=${position.id}`}
              className={applyLinkClasses}
            >
              Apply now →
            </Link>
          ) : (
            <span className={closedHintClasses}>
              {!applicationsOpen ? "Applications not open" : "Applications closed"}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
