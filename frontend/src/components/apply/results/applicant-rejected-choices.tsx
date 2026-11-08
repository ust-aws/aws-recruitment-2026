import type { ApplicantChoice } from "@/lib/api/applicant"

// Each choice as a ruled row with its outcome. Neutral, not alarm red: this
// is a result, not an error the applicant has to fix.
const listClasses = "divide-y divide-blue-chalk/10 border-y border-blue-chalk/10"
const itemClasses = "flex min-w-0 items-start justify-between gap-4 py-3"
const rankClasses = "font-mono text-xs uppercase tracking-[0.12em] text-prelude"
const committeeClasses = "mt-0.5 font-sans text-sm font-semibold text-blue-chalk"
const titleClasses = "font-sans text-sm text-prelude"
const outcomeClasses = "shrink-0 pt-0.5 font-sans text-xs text-prelude"

const RANK_LABELS: Record<ApplicantChoice["preferenceRank"], string> = {
  1: "1st choice",
  2: "2nd choice",
}

/** Lists each position choice as not accepted, for applicants who were not selected. */
export function ApplicantRejectedChoices({ choices }: { choices: ApplicantChoice[] }) {
  if (choices.length === 0) return null
  const ordered = [...choices].sort((a, b) => a.preferenceRank - b.preferenceRank)

  return (
    <ul className={listClasses} aria-label="Your position choices">
      {ordered.map((choice) => (
        <li key={choice.positionId} className={itemClasses}>
          <div className="min-w-0">
            <p className={rankClasses}>{RANK_LABELS[choice.preferenceRank]}</p>
            <p className={committeeClasses}>{choice.committee}</p>
            {choice.title !== choice.committee ? <p className={titleClasses}>{choice.title}</p> : null}
          </div>
          <span className={outcomeClasses}>Not accepted</span>
        </li>
      ))}
    </ul>
  )
}
