import type { Metadata } from "next"
import { EventsSection } from "@/components/events/events-section"

export const metadata: Metadata = {
  title: "Events – AWS Builders – UST",
}

export default function EventsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 pb-16 pt-20 md:px-10 md:pt-24">
      <EventsSection />
    </main>
  )
}
