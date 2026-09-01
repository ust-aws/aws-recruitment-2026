import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/section-header"
import { Hero } from "@/components/hero"
import { Committees } from "@/components/committees"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const FAQ_ITEMS = [
  {
    question: "Do I need coding experience to join?",
    answer:
      "No — we teach cloud computing and AI from the ground up. Curiosity is the only prerequisite.",
  },
  {
    question: 'Is this only for "techy" students?',
    answer:
      "Not at all. Builders from every major join for the workshops, the community, and the hands-on projects.",
  },
  {
    question: "What's the time commitment?",
    answer:
      "As much or as little as you want — drop into weekly sessions or go deeper with a committee.",
  },
  {
    question: "How do I apply?",
    answer: "Hit the \"Apply now!\" button in the navbar and fill out the short form.",
  },
]

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-4 pt-16">
      <Hero />
      <Committees />
      <div className="flex flex-col gap-10 pt-[clamp(3rem,7vw,5.625rem)]">
        <SectionHeader
          eyebrow="// what we do · faqs"
          title="No cloud background required. Just curiosity."
          subtitle="You don't need a technical background to join AWS Builders – UST. We teach cloud computing and AI from the ground up — through workshops, build sessions, and a community that learns loudly and together."
        />

        <div className="flex flex-wrap items-center gap-4">
        <Button color="cyan">Apply now!</Button>
        <Button color="purple">Committee Directors</Button>
      </div>

      <Accordion>
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
    </main>  )
}
