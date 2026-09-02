import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "General Info" },
  { n: 2, label: "Committee" },
  { n: 3, label: "Resume" },
] as const

const rowClasses = "mx-auto flex w-full max-w-md items-start justify-center"
const connectorClasses = "mt-4 h-px min-w-8 flex-1 bg-biloba-flower/40"
const circleBase =
  "flex size-9 items-center justify-center rounded-full font-sans text-sm font-semibold"
const currentCircle = `${circleBase} bg-aquamarine text-haiti`
const completeCircle = `${circleBase} bg-biloba-flower text-haiti`
const upcomingCircle = `${circleBase} border border-prelude/50 text-prelude`
const labelBase = "mt-2 text-center font-sans text-xs"
const currentLabel = `${labelBase} text-aquamarine`
const completeLabel = `${labelBase} text-prelude`
const upcomingLabel = `${labelBase} text-prelude/70`

type StepperProps = {
  current: 1 | 2 | 3
}

export function ApplyStepper({ current }: StepperProps) {
  return (
    <ol className={rowClasses}>
      {STEPS.map((step, index) => {
        const state =
          step.n < current ? "complete" : step.n === current ? "current" : "upcoming"
        return (
          <li key={step.n} className="flex min-w-0 flex-1 items-start">
            {index > 0 && <div className={connectorClasses} aria-hidden="true" />}
            <div className="flex flex-col items-center px-2">
              <span
                className={cn(
                  state === "current" && currentCircle,
                  state === "complete" && completeCircle,
                  state === "upcoming" && upcomingCircle
                )}
              >
                {state === "complete" ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  step.n
                )}
              </span>
              <span
                className={cn(
                  state === "current" && currentLabel,
                  state === "complete" && completeLabel,
                  state === "upcoming" && upcomingLabel
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={connectorClasses} aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
