import type { ApplicantChoice } from "@/lib/applicant-api"

const choicesClasses = "grid gap-4 md:grid-cols-2"
const choiceCardClasses = "rounded-[22px] bg-haiti/70 px-5 py-5"
const choiceEyebrowClasses =
  "font-mono text-[11px] uppercase tracking-wide text-prelude"
const choiceTitleClasses = "mt-1 font-sans text-xl font-bold text-blue-chalk"
const choicePositionClasses = "mt-1 font-sans text-sm text-aquamarine"

function ChoiceCard({
  label,
  choice,
}: {
  label: string
  choice: ApplicantChoice | undefined
}) {
  return (
    <div className={choiceCardClasses}>
      <p className={choiceEyebrowClasses}>{label}</p>
      <p className={choiceTitleClasses}>{choice?.committee ?? "—"}</p>
      <p className={choicePositionClasses}>
        Position: {choice?.title ?? "—"}
      </p>
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
    <div className={choicesClasses}>
      <ChoiceCard label="First Choice" choice={first} />
      <ChoiceCard label="Second Choice" choice={second} />
    </div>
  )
}
