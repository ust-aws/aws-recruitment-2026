import { StatusPill } from "@/components/hr/status-pill"
import type {
  ApplicantChoice,
  ApplicantResult,
} from "@/lib/api/applicant"
import { formatDatetimeDisplay } from "@/lib/datetime/datetime-local"
import { glassPanelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} mt-6 rounded-[22px] px-5 py-5`
const eyebrowClasses =
  "font-mono text-[10px] uppercase tracking-[0.16em] text-aquamarine"
const headingClasses = "mt-2 font-sans text-2xl font-bold text-blue-chalk"
const bodyClasses = "mt-2 font-sans text-sm leading-relaxed text-prelude"
const detailGridClasses = "mt-5 grid gap-3 sm:grid-cols-2"
const detailClasses = "rounded-[14px] bg-haiti/55 px-4 py-3"
const detailLabelClasses =
  "font-mono text-[10px] uppercase tracking-wide text-prelude"
const detailValueClasses = "mt-1 font-sans text-sm font-semibold text-blue-chalk"
const choiceListClasses = "mt-5 flex flex-col gap-2"
const choiceRowClasses =
  "flex items-center justify-between gap-3 rounded-[14px] bg-haiti/55 px-4 py-3"
const choiceNameClasses = "font-sans text-sm text-blue-chalk"

export function ApplicantResultPanel({
  result,
  choices,
}: {
  result: ApplicantResult
  choices: ApplicantChoice[]
}) {
  const accepted = result.status === "approved"

  return (
    <section className={panelClasses} aria-labelledby="application-result-title">
      <p className={eyebrowClasses}>Final result</p>
      <h2 id="application-result-title" className={headingClasses}>
        {accepted ? "Welcome to AWS Builders – UST" : "Application update"}
      </h2>
      <p className={bodyClasses}>
        {accepted
          ? "Your application was accepted. Your final placement and Member ID are shown below."
          : "Thank you for applying. You were not selected for this recruitment cycle."}
      </p>

      {accepted ? (
        <div className={detailGridClasses}>
          <div className={detailClasses}>
            <p className={detailLabelClasses}>Final placement</p>
            <p className={detailValueClasses}>
              {result.finalPlacement
                ? `${result.finalPlacement.committee} — ${result.finalPlacement.title}`
                : "—"}
            </p>
          </div>
          <div className={detailClasses}>
            <p className={detailLabelClasses}>Member ID</p>
            <p className={detailValueClasses}>{result.memberId ?? "—"}</p>
          </div>
        </div>
      ) : null}

      <div className={choiceListClasses}>
        {result.choices.map((decision) => {
          const choice = choices.find(
            (item) => item.preferenceRank === decision.preferenceRank
          )
          return (
            <div key={decision.preferenceRank} className={choiceRowClasses}>
              <p className={choiceNameClasses}>
                {decision.preferenceRank === 1 ? "First" : "Second"} choice: {" "}
                {choice?.committee ?? "Committee"}
              </p>
              <StatusPill status={decision.decisionStatus} />
            </div>
          )
        })}
      </div>

      <p className={bodyClasses}>
        Released {formatDatetimeDisplay(result.releasedAt)}
      </p>
    </section>
  )
}
