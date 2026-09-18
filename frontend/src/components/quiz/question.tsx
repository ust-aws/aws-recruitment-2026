import type { QuizQuestion } from "@/lib/quiz/data"

const cardClasses =
  "glass flex flex-col gap-5 rounded-[18px] border border-biloba-flower/25 bg-daisy-bush/35 p-5 sm:p-6"
const kickerClasses =
  "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-aquamarine"
const promptClasses = "text-lg font-semibold leading-snug text-blue-chalk sm:text-xl"
const listClasses = "m-0 flex list-none flex-col gap-2 p-0"
const optionClasses =
  "w-full rounded-[14px] border border-biloba-flower/20 bg-haiti/45 px-4 py-3 text-left text-sm leading-relaxed text-blue-chalk transition-[background-color,border-color,transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:border-biloba-flower/45 hover:bg-daisy-bush/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/50 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:transform-none"

type QuizQuestionCardProps = {
  question: QuizQuestion
  index: number
  total: number
  locked?: boolean
  onSelect: (optionId: string) => void
}

export function QuizQuestionCard({
  question,
  index,
  total,
  locked = false,
  onSelect,
}: QuizQuestionCardProps) {
  return (
    <div className={cardClasses}>
      <p className={kickerClasses}>
        {question.code} · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      {question.kicker ? (
        <p className="text-sm italic text-prelude">{question.kicker}</p>
      ) : null}
      <h3 className={promptClasses}>{question.prompt}</h3>
      <ul className={listClasses}>
        {question.options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={optionClasses}
              disabled={locked}
              onClick={() => onSelect(option.id)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
