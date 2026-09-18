import { SectionHeader } from "@/components/shared/section-header"
import { displayTitleLeadingClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const INFO_CARDS = [
  {
    number: "01",
    title: "Learn cloud & AI from scratch",
    description:
      "Hands-on sessions on AWS fundamentals, cloud architecture, and applied AI — paced for beginners, useful for anyone.",
  },
  {
    number: "02",
    title: "Build real things",
    description:
      "Project sprints, hackathons, and a home-grown stack builder mindset — you leave every session having shipped something.",
  },
  {
    number: "03",
    title: "Belong to a bigger network",
    description:
      "UST is one chapter in a global builder community — connect with other AWS chapters across the Philippines and the world.",
  },
]

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
    answer:
      'Hit "Apply now!" or "Start application" on the Careers page, then browse open positions and fill out the short form.',
  },
]

const sectionClasses =
  "faq-section flex flex-col gap-8 pt-[clamp(3rem,7vw,5.625rem)] md:gap-10"
const headerClasses = "[&>h2]:max-w-[720px] [&>p:last-child]:max-w-[1080px]"
const headingClasses = cn(
  "text-5xl sm:text-6xl lg:text-[3.75rem]",
  displayTitleLeadingClasses
)
const layoutClasses =
  "grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14"
const cardListClasses = "flex flex-col gap-4"
const cardClasses =
  "glass flex min-h-[6.625rem] gap-4 rounded-[28px] border border-biloba-flower/25 bg-meteorite/55 p-5"
const numberClasses =
  "flex size-12 shrink-0 items-center justify-center rounded-[9px] bg-biloba-flower font-mono text-sm font-semibold text-haiti"
const cardContentClasses = "flex flex-col gap-2"
const cardTitleClasses = "font-sans text-lg font-bold text-blue-chalk"
const cardDescriptionClasses = "font-sans text-sm leading-relaxed text-prelude"
const accordionClasses = "self-start lg:pt-14"

export function FAQSection() {
  return (
    <section className={sectionClasses} aria-labelledby="faq-title">
      <SectionHeader
        eyebrow="// what we do · faqs"
        className={headerClasses}
        titleClassName={headingClasses}
        title={
          <span id="faq-title">
            No cloud background
            <br />
            required. Just curiosity.
          </span>
        }
        subtitle="You don't need a technical background to join AWS Builders – UST. We teach cloud computing and AI from the ground up — through workshops, build sessions, and a community that learns loudly and together."
      />

      <div className={layoutClasses}>
        <div className={cardListClasses}>
          {INFO_CARDS.map((card) => (
            <article key={card.number} className={cardClasses}>
              <span className={numberClasses}>{card.number}</span>
              <div className={cardContentClasses}>
                <h3 className={cardTitleClasses}>{card.title}</h3>
                <p className={cardDescriptionClasses}>{card.description}</p>
              </div>
            </article>
          ))}
        </div>

        <Accordion className={accordionClasses}>
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
