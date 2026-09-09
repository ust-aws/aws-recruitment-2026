import Link from "next/link"
import { Button } from "@/components/ui/button"
import { COMMITTEES } from "@/lib/committee-quiz-data"
import {
  committeeName,
  type QuizResult,
} from "@/lib/committee-quiz-score"

const cardClasses =
  "glass flex flex-col gap-5 rounded-[18px] border border-biloba-flower/25 bg-daisy-bush/35 p-5 sm:p-6"
const kickerClasses =
  "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-aquamarine"
const titleClasses =
  "font-sans text-3xl font-bold leading-tight text-blue-chalk sm:text-4xl"
const matchClasses = "text-2xl font-semibold uppercase tracking-wide text-aquamarine sm:text-3xl"
const blurbClasses = "text-base leading-relaxed text-prelude"
const alsoLabelClasses =
  "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-prelude"
const pillRowClasses = "flex flex-wrap gap-2"
const pillClasses =
  "rounded-pill border border-biloba-flower/30 bg-haiti/50 px-3 py-1 text-sm text-blue-chalk"
const eaClasses =
  "flex flex-col gap-2 rounded-[14px] border border-aquamarine/25 bg-haiti/40 px-4 py-3"
const actionsClasses = "flex flex-wrap gap-3 pt-2"
const buttonClasses =
  "h-11 px-5 text-sm transition-[background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(90,240,192,0.45)] active:translate-y-0 motion-reduce:transition-none"

type QuizResultsProps = {
  result: QuizResult
  onRetake: () => void
}

export function QuizResults({ result, onRetake }: QuizResultsProps) {
  const primaryLabel = result.primary.map(committeeName).join(" · ")
  const primaryBlurb = COMMITTEES[result.primary[0]].blurb
  const equallyMatched = result.primary.length > 1

  return (
    <div className={cardClasses}>
      <p className={kickerClasses}>$ deploy --result</p>
      <h3 className={titleClasses}>Your AWS deployment is ready.</h3>
      <p className={alsoLabelClasses}>
        {equallyMatched ? "Primary matches" : "Primary match"}
      </p>
      <p className={matchClasses}>{primaryLabel}</p>
      <p className={blurbClasses}>{primaryBlurb}</p>

      {result.alsoCompatible.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={alsoLabelClasses}>Also compatible with</p>
          <div className={pillRowClasses}>
            {result.alsoCompatible.map((id) => (
              <span key={id} className={pillClasses}>
                {committeeName(id)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {result.executiveAssistant ? (
        <aside className={eaClasses}>
          <p className={alsoLabelClasses}>Additional match · Executive Assistant</p>
          <p className="text-sm leading-relaxed text-blue-chalk">
            Your results also show strong potential for a role involving coordination,
            organization, and close collaboration with an Executive Board officer.
          </p>
          <p className="text-sm text-prelude">
            Potential EB match: {result.executiveAssistant.officer}
          </p>
        </aside>
      ) : null}

      <div className={actionsClasses}>
        <Button
          color="cyan"
          className={buttonClasses}
          nativeButton={false}
          render={<Link href="/apply/positions" />}
        >
          Apply now
        </Button>
        <Button color="purple" className={buttonClasses} onClick={onRetake}>
          Retake quiz
        </Button>
      </div>
    </div>
  )
}
