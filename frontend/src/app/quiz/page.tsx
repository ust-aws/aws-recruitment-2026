import type { Metadata } from "next"
import { CommitteeQuiz } from "@/components/committee-quiz"

export const metadata: Metadata = {
  title: "Committee Quiz – AWS Builders – UST",
}

export default function QuizPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-16">
      <CommitteeQuiz />
    </main>
  )
}
