import type { ApplicantChoice } from "@/lib/api/applicant"

// The two committee choices as ruled rows: rank, committee, position.
const listClasses = "divide-y divide-blue-chalk/10 border-y border-blue-chalk/10"
const rowClasses = "grid min-w-0 gap-x-4 gap-y-0.5 py-3 sm:grid-cols-[7rem_1fr] sm:items-baseline"
const rankClasses = "font-mono text-xs uppercase tracking-[0.12em] text-prelude"
const committeeClasses = "font-sans text-base font-semibold text-balance text-blue-chalk"
const positionClasses = "font-sans text-sm text-pretty text-prelude"

function ChoiceRow({ rank, choice }: { rank: string; choice: ApplicantChoice | undefined }) {
  return (
    <div className={rowClasses}>
      <dt className={rankClasses}>{rank}</dt>
      <dd className="min-w-0">
        <p className={committeeClasses}>{choice?.committee ?? "—"}</p>
        {choice && choice.title !== choice.committee ? <p className={positionClasses}>{choice.title}</p> : null}
      </dd>
    </div>
  )
}

export function ApplicantChoiceCards({
  first,
  second,
}: {
  first: ApplicantChoice | undefined
  second: ApplicantChoice | undefined
}) {
  return (
    <dl className={listClasses}>
      <ChoiceRow rank="1st choice" choice={first} />
      <ChoiceRow rank="2nd choice" choice={second} />
    </dl>
  )
}
