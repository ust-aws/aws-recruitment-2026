import type { Metadata } from "next"
import { MissionVision } from "@/components/mission-vision"

export const metadata: Metadata = {
  title: "About – AWS Builders – UST",
}

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-16">
      <MissionVision />
    </main>
  )
}
