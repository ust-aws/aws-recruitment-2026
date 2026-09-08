"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { SectionHeader } from "@/components/section-header"
import { QuizQuestionCard } from "@/components/quiz-question"
import { QuizResults } from "@/components/quiz-results"
import { QUESTIONS } from "@/lib/committee-quiz-data"
import { scoreQuiz } from "@/lib/committee-quiz-score"

const sectionClasses = "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)]"
const headerWidthClasses = "[&>h2]:max-w-[46rem] [&>p:last-child]:max-w-[60rem]"
const bodyClasses =
  "grid grid-cols-1 items-start gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-2"
const figureClasses = "flex flex-col items-center gap-5 lg:sticky lg:top-28"
const imageWrapperClasses =
  "relative aspect-square w-full max-w-[22rem] drop-shadow-[0_0_48px_rgba(183,140,240,0.28)]"
const captionClasses =
  "max-w-[22rem] text-center text-sm leading-relaxed text-prelude"

const QUIZ_CAPTION =
  "I’m SOOOO excited to know what committee you’d belong!"
const RESULT_CAPTION =
  "Told you I’d find you a stack. Now go ship it — or retake if you want a second opinion."
const ANSWER_LOCK_MS = 400

export function CommitteeQuiz() {
  const [answers, setAnswers] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const accepting = useRef(true)
  const unlockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const complete = answers.length === QUESTIONS.length
  const step = complete ? QUESTIONS.length - 1 : answers.length

  useEffect(() => {
    return () => {
      if (unlockTimeout.current !== null) {
        clearTimeout(unlockTimeout.current)
      }
    }
  }, [])

  function selectOption(optionId: string) {
    if (!accepting.current || complete) return
    accepting.current = false
    setLocked(true)
    setAnswers((current) =>
      current.length === QUESTIONS.length ? current : [...current, optionId]
    )
    unlockTimeout.current = setTimeout(() => {
      accepting.current = true
      setLocked(false)
      unlockTimeout.current = null
    }, ANSWER_LOCK_MS)
  }

  function retakeQuiz() {
    if (unlockTimeout.current !== null) {
      clearTimeout(unlockTimeout.current)
      unlockTimeout.current = null
    }
    accepting.current = true
    setLocked(false)
    setAnswers([])
  }

  return (
    <div
      id="committee-quiz"
      aria-labelledby="committee-quiz-title"
      className={sectionClasses}
    >
      <SectionHeader
        className={headerWidthClasses}
        eyebrow="// committee quiz"
        title={
          <span id="committee-quiz-title">
            {complete ? "Your match is in." : "Not sure where you’d fit?"}
          </span>
        }
        subtitle={
          complete
            ? "Espi packed a primary committee — and a couple of backups — from how you actually work."
            : "Answer ten quick questions and Espi will point you toward a committee."
        }
      />

      <div className={bodyClasses}>
        <figure className={figureClasses}>
          <div className={imageWrapperClasses}>
            <Image
              src="/espi.png"
              alt="Espi, the AWS Builders – UST mascot"
              fill
              sizes="(min-width: 1024px) 22rem, 100vw"
              className="object-contain"
              unoptimized
              priority
            />
          </div>
          <figcaption className={captionClasses}>
            {complete ? RESULT_CAPTION : QUIZ_CAPTION}
          </figcaption>
        </figure>

        {complete ? (
          <QuizResults
            result={scoreQuiz(answers)}
            onRetake={retakeQuiz}
          />
        ) : (
          <QuizQuestionCard
            key={step}
            question={QUESTIONS[step]}
            index={step}
            total={QUESTIONS.length}
            locked={locked}
            onSelect={selectOption}
          />
        )}
      </div>
    </div>
  )
}
