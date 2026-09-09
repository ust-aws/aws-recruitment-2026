import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/section-header"

const HIGHLIGHTS = [
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
] as const

const sectionClasses = "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)]"
const headerWidthClasses = "[&>h2]:max-w-[46rem] [&>p:last-child]:max-w-[60rem]"
const cardListClasses = "grid gap-4 md:grid-cols-3"
const cardClasses =
  "glass flex h-full min-h-[10rem] flex-col gap-4 rounded-[28px] border border-biloba-flower/25 bg-meteorite/55 p-5"
const numberClasses =
  "flex size-12 shrink-0 items-center justify-center rounded-[9px] bg-biloba-flower font-mono text-sm font-semibold text-haiti"
const cardTitleClasses = "font-sans text-lg font-bold text-blue-chalk"
const cardDescriptionClasses = "font-sans text-sm leading-relaxed text-prelude"
const ctaClasses =
  "glass flex flex-col gap-5 rounded-[28px] border border-biloba-flower/25 bg-daisy-bush/35 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8"
const ctaTextClasses = "font-sans text-base font-medium text-blue-chalk sm:text-lg"
const ctaCopyClasses = "mt-1 font-sans text-sm leading-relaxed text-prelude"
const ctaButtonClasses = "h-11 px-6 text-sm"

export function CareersSection() {
  return (
    <section
      id="careers"
      aria-labelledby="careers-title"
      className={sectionClasses}
    >
      <SectionHeader
        className={headerWidthClasses}
        eyebrow="// careers"
        title={
          <span id="careers-title">Build with us at UST.</span>
        }
        subtitle="AWS Builders – UST runs a yearly recruitment cycle for executive assistants and committee staff. When applications open, you can explore open roles and submit your application in the apply flow."
      />

      <div className={cardListClasses}>
        {HIGHLIGHTS.map((card) => (
          <article key={card.number} className={cardClasses}>
            <span className={numberClasses}>{card.number}</span>
            <div className="flex flex-col gap-2">
              <h3 className={cardTitleClasses}>{card.title}</h3>
              <p className={cardDescriptionClasses}>{card.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className={ctaClasses}>
        <div>
          <p className={ctaTextClasses}>Ready to apply?</p>
          <p className={ctaCopyClasses}>
            Start your application to browse open positions and tell us which
            committees fit you best.
          </p>
        </div>
        <Button
          color="cyan"
          className={ctaButtonClasses}
          nativeButton={false}
          render={<Link href="/apply/positions" />}
        >
          Start application
        </Button>
      </div>
    </section>
  )
}
