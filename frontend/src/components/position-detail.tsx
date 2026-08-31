import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Position } from "@/lib/positions"
import { isAssistantRole, openSpots } from "@/lib/positions"

const articleClasses =
  "flex min-h-0 max-h-[min(72vh,46rem)] flex-col border-blue-chalk/15"
const bodyClasses = "panel-scroll flex flex-1 flex-col gap-6 overflow-y-auto p-6"
const committeeClasses =
  "font-mono text-xs uppercase tracking-wide text-aquamarine"
const titleClasses = "font-sans text-3xl font-bold leading-tight text-blue-chalk"
const pillClasses =
  "w-fit rounded-pill border border-biloba-flower/35 bg-daisy-bush/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue-chalk"
const assistantPillClasses =
  "border-aquamarine/40 bg-aquamarine/15 text-aquamarine"
const metaRowClasses = "flex flex-wrap items-center gap-2"
const copyClasses = "font-sans text-sm leading-relaxed text-prelude"
const labelClasses =
  "font-mono text-[11px] uppercase tracking-wide text-aquamarine"
const dutyRowClasses = "flex gap-3 font-sans text-sm leading-relaxed text-prelude"
const dutyIndexClasses = "w-6 shrink-0 font-mono text-xs text-aquamarine"
const footerClasses =
  "flex shrink-0 items-center justify-between gap-4 border-t border-blue-chalk/15 bg-haiti/40 px-6 py-4"
const footerHintClasses = "hidden font-mono text-xs text-prelude sm:block"
const applyLinkClasses =
  "glass inline-flex w-fit items-center justify-center rounded-[14px] border border-aquamarine/40 bg-aquamarine/85 px-5 py-3 font-mono text-sm text-haiti transition-shadow hover:bg-aquamarine/95 hover:shadow-[0_0_24px_rgba(90,240,192,0.45)]"

type PositionDetailProps = {
  position: Position
}

export function PositionDetail({ position }: PositionDetailProps) {
  const assistant = isAssistantRole(position)
  const spots = openSpots(position)

  return (
    <article className={articleClasses}>
      <div key={position.id} className="reveal flex min-h-0 flex-1 flex-col">
        <div className={bodyClasses}>
          <div className="flex flex-col gap-3">
            <p className={committeeClasses}>{position.committee}</p>
            <h1 className={titleClasses}>{position.title}</h1>
            <div className={metaRowClasses}>
              <span className={cn(pillClasses, assistant && assistantPillClasses)}>
                {assistant ? "executive assistant" : "committee staff"}
              </span>
              <span className={cn(pillClasses, assistantPillClasses)}>
                {spots} {spots === 1 ? "spot" : "spots"} available
              </span>
            </div>
          </div>

          <section className="flex flex-col gap-2">
            <h2 className={labelClasses}>// committee</h2>
            <p className={copyClasses}>{position.committeeDescription}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className={labelClasses}>// role</h2>
            <p className={copyClasses}>{position.description}</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className={labelClasses}>// responsibilities</h2>
            <ol className="flex flex-col gap-2.5">
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
          <p className={footerHintClasses}>Ready to ship with us?</p>
          <Link href="/apply" className={applyLinkClasses}>
            Apply now →
          </Link>
        </div>
      </div>
    </article>
  )
}
