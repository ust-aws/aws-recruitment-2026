import type { ApplicationChoice } from "@/lib/types/application"

const choicesClasses = "mt-8 grid gap-4 md:grid-cols-2"
const choiceCardClasses = "rounded-[22px] bg-haiti/70 px-5 py-5"
const choiceEyebrowClasses =
  "font-mono text-[11px] uppercase tracking-wide text-prelude"
const choiceTitleClasses = "mt-1 font-sans text-xl font-bold text-blue-chalk"
const choicePositionClasses = "mt-1 font-sans text-sm text-aquamarine"

function ChoiceCard({
  label,
  choice,
  memberOnly = false,
}: {
  label: string
  choice: ApplicationChoice | undefined
  memberOnly?: boolean
}) {
  return (
    <div className={choiceCardClasses}>
      <p className={choiceEyebrowClasses}>{label}</p>
      <p className={choiceTitleClasses}>
        {memberOnly ? "MEMBER" : choice?.committee}
      </p>
      {memberOnly ? null : (
        <p className={choicePositionClasses}>Position: {choice?.title}</p>
      )}
    </div>
  )
}

export function ChoiceCards({
  first,
  second,
  memberOnly = false,
}: {
  first: ApplicationChoice | undefined
  second: ApplicationChoice | undefined
  memberOnly?: boolean
}) {
  return (
    <div className={choicesClasses}>
      {memberOnly ? (
        <ChoiceCard label="Application type" choice={undefined} memberOnly />
      ) : (
        <>
          <ChoiceCard label="First Choice" choice={first} />
          <ChoiceCard label="Second Choice" choice={second} />
        </>
      )}
    </div>
  )
}
