"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { scrollToSection } from "@/lib/site/scroll-to-section"

const CommitteeQuiz = dynamic(() =>
  import("@/components/quiz/committee-quiz").then((module) => module.CommitteeQuiz)
)

const ctaClasses =
  "flex min-h-[6.5rem] flex-col gap-5 rounded-[18px] border border-biloba-flower/25 bg-daisy-bush/35 p-5 shadow-[0_0_28px_rgba(183,140,240,0.12)] sm:flex-row sm:items-center sm:justify-between sm:px-7"
const ctaTextClasses = "text-base font-medium text-blue-chalk sm:text-lg"
const ctaButtonClasses = "h-11 px-6 text-sm transition-[background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(90,240,192,0.45)] active:translate-y-0 motion-reduce:transition-none sm:h-12 sm:px-7 sm:text-base"

export function QuizGate() {
  const [quizOpen, setQuizOpen] = useState(false)

  useEffect(() => {
    if (window.location.hash !== "#committee-quiz") return
    const frame = window.requestAnimationFrame(() => setQuizOpen(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (quizOpen) scrollToSection("committee-quiz")
  }, [quizOpen])

  return (
    <>
      <div className={ctaClasses}>
        <p className={ctaTextClasses}>Not sure which one fits you?</p>
        <Button color="cyan" className={ctaButtonClasses} onClick={() => setQuizOpen(true)}>
          Take the committee quiz
        </Button>
      </div>
      {quizOpen ? <CommitteeQuiz className="-mt-2" /> : null}
    </>
  )
}
