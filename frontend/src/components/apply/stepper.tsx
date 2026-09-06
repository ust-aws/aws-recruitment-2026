"use client"

import { Check } from "lucide-react"
import { m, useReducedMotion } from "motion/react"
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
const currentCircle = `${circleBase} bg-aquamarine text-haiti border border-transparent`
const completeCircle = `${circleBase} bg-biloba-flower text-haiti border border-transparent`
const upcomingCircle = `${circleBase} border border-prelude/50 bg-transparent text-prelude`
const labelBase = "mt-2 text-center font-sans text-xs"
const currentLabel = `${labelBase} text-aquamarine`
const completeLabel = `${labelBase} text-prelude`
const upcomingLabel = `${labelBase} text-prelude/70`

const bubbleSpring = { type: "spring" as const, stiffness: 400, damping: 35 }
const bubbleSnap = { duration: 0 }

type StepperProps = {
  current: 1 | 2 | 3
}

export function ApplyStepper({ current }: StepperProps) {
  const reducedMotion = useReducedMotion() ?? false
  const transition = reducedMotion ? bubbleSnap : bubbleSpring

  return (
    <ol className={rowClasses}>
      {STEPS.map((step, index) => {
        const state =
          step.n < current
            ? "complete"
            : step.n === current
              ? "current"
              : "upcoming"
        const leftConnectorDone = current >= step.n
        const rightConnectorDone = step.n < current

        return (
          <li key={step.n} className="flex min-w-0 flex-1 items-start">
            {index > 0 ? (
              <m.div
                className={connectorClasses}
                aria-hidden="true"
                initial={false}
                animate={{ opacity: leftConnectorDone ? 1 : 0.4 }}
                transition={transition}
              />
            ) : null}
            <div className="flex flex-col items-center px-2">
              <m.span
                className={cn(
                  state === "current" && currentCircle,
                  state === "complete" && completeCircle,
                  state === "upcoming" && upcomingCircle
                )}
                initial={false}
                animate={{ scale: state === "current" ? 1.05 : 1 }}
                transition={transition}
              >
                {state === "complete" ? (
                  <m.span
                    key="check"
                    initial={
                      reducedMotion ? false : { scale: 0.6, opacity: 0 }
                    }
                    animate={{ scale: 1, opacity: 1 }}
                    transition={transition}
                    className="inline-flex"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </m.span>
                ) : (
                  step.n
                )}
              </m.span>
              <m.span
                className={cn(
                  state === "current" && currentLabel,
                  state === "complete" && completeLabel,
                  state === "upcoming" && upcomingLabel
                )}
                initial={false}
                animate={{ opacity: state === "upcoming" ? 0.7 : 1 }}
                transition={transition}
              >
                {step.label}
              </m.span>
            </div>
            {index < STEPS.length - 1 ? (
              <m.div
                className={connectorClasses}
                aria-hidden="true"
                initial={false}
                animate={{ opacity: rightConnectorDone ? 1 : 0.4 }}
                transition={transition}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
