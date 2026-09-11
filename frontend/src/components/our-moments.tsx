"use client"

import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"
import { SectionHeader } from "@/components/section-header"
import { cn } from "@/lib/utils"

type Moment = {
  id: string
  date: string
  label: string
  description: string
}

const MOMENTS: Moment[] = [
  {
    id: "kickoff",
    date: "August 2024",
    label: "Org kickoff and first builders meetup",
    description:
      "Eight co-founders welcomed the first builders, shared why cloud mattered on campus, and set the tone for committees, workshops, and the community we run today.",
  },
  {
    id: "ga",
    date: "October 2024",
    label: "First general assembly of the academic year",
    description:
      "Members met officers, walked through the semester roadmap, and signed up for the committees where they wanted to learn, ship, and lead.",
  },
  {
    id: "workshop",
    date: "January 2025",
    label: "AWS cloud workshop series",
    description:
      "Hands-on labs walked Thomasians through core AWS services with mentors from the builder community guiding each session.",
  },
  {
    id: "recruitment",
    date: "March 2025",
    label: "Recruitment season opens to campus",
    description:
      "Applications opened for the next wave of members to join committees and help shape how AWS Builders – UST grows in the year ahead.",
  },
  {
    id: "outreach",
    date: "June 2025",
    label: "Community outreach and partner events",
    description:
      "The club partnered with peers and industry guests to bring cloud learning beyond CICS and connect builders across the network.",
  },
  {
    id: "builders-night",
    date: "August 2025",
    label: "Year-end builders night celebration",
    description:
      "Builders celebrated wins from the year with demos, shout-outs, and plans for what to ship together next.",
  },
]

const sectionClasses = "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)]"
const timelineShellClasses = "relative mx-auto w-full max-w-5xl"
const lineClasses =
  "pointer-events-none absolute top-2 bottom-2 left-1/2 w-px -translate-x-1/2 bg-biloba-flower/25"
const timelineClasses = "flex flex-col"
const entryClasses = "relative pb-14 last:pb-0 md:pb-16"
const entryGridClasses = "grid gap-6 pt-9 md:grid-cols-2 md:items-center md:gap-10 md:pt-0"
const dotShellClasses =
  "absolute top-1.5 left-1/2 z-10 -translate-x-1/2 md:top-1/2 md:-translate-y-1/2"
const dotClasses = "size-3 rounded-full border-2 bg-haiti"
const descriptionColClasses =
  "hidden flex-col justify-center md:flex md:py-2"
const descriptionColRightClasses = "md:order-1 md:pr-8 md:text-right"
const descriptionColLeftClasses = "md:order-2 md:pl-8"
const descriptionClasses =
  "font-sans text-sm leading-relaxed text-prelude md:text-base"
const descriptionMobileClasses = "mt-2 md:hidden"
const mediaColClasses = "min-w-0"
const mediaColRightClasses = "md:order-2 md:pl-8"
const mediaColLeftClasses = "md:order-1 md:pr-8 md:text-right"
const dateClasses = "font-mono text-sm font-medium text-aquamarine"
const labelClasses = "mt-1 font-sans text-sm font-medium leading-snug text-blue-chalk"
const mediaClasses =
  "glass mt-4 aspect-[4/3] w-full rounded-[14px] border border-blue-chalk/20 bg-meteorite/45"

const revealSnap = { duration: 0 }
const revealEase = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }

const dotRest = {
  scale: 0.6,
  opacity: 0.4,
  borderColor: "rgba(90,240,192,0.35)",
  backgroundColor: "rgba(23,15,51,1)",
  boxShadow: "0 0 0 4px rgba(23,15,51,1)",
}

const dotActive = {
  scale: 1,
  opacity: 1,
  borderColor: "rgba(90,240,192,1)",
  backgroundColor: "rgba(90,240,192,1)",
  boxShadow: "0 0 16px rgba(90,240,192,0.55)",
}

type TimelineEntryProps = {
  moment: Moment
  index: number
  reducedMotion: boolean | null
}

function TimelineEntry({ moment, index, reducedMotion }: TimelineEntryProps) {
  const mediaOnRight = index % 2 === 0
  const mediaEnterX = mediaOnRight ? 28 : -28
  const copyEnterX = mediaOnRight ? -20 : 20

  return (
    <li className={entryClasses}>
      <div className={dotShellClasses}>
        <m.div
          className={dotClasses}
          initial={reducedMotion ? false : dotRest}
          whileInView={reducedMotion ? undefined : dotActive}
          viewport={{ once: true, amount: 0.45 }}
          transition={reducedMotion ? revealSnap : { ...revealEase, delay: 0.08 }}
          aria-hidden
        />
      </div>

      <div className={entryGridClasses}>
        <m.div
          className={cn(
            descriptionColClasses,
            mediaOnRight ? descriptionColRightClasses : descriptionColLeftClasses
          )}
          initial={reducedMotion ? false : { opacity: 0, y: 16, x: copyEnterX }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={reducedMotion ? revealSnap : { ...revealEase, delay: 0.06 }}
        >
          <p className={descriptionClasses}>{moment.description}</p>
        </m.div>

        <m.article
          className={cn(
            mediaColClasses,
            mediaOnRight ? mediaColRightClasses : mediaColLeftClasses
          )}
          initial={reducedMotion ? false : { opacity: 0, y: 24, x: mediaEnterX }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reducedMotion ? revealSnap : revealEase}
        >
          <time dateTime={moment.date} className={dateClasses}>
            {moment.date}
          </time>
          <p className={labelClasses}>{moment.label}</p>
          <p className={cn(descriptionClasses, descriptionMobileClasses)}>
            {moment.description}
          </p>
          <m.div
            className={mediaClasses}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={
              reducedMotion ? revealSnap : { ...revealEase, delay: 0.12 }
            }
            aria-hidden
          />
        </m.article>
      </div>
    </li>
  )
}

export function OurMoments() {
  const reducedMotion = useReducedMotion()

  return (
    <section
      id="our-moments"
      aria-labelledby="our-moments-title"
      className={sectionClasses}
    >
      <SectionHeader
        eyebrow="// our moments"
        title={
          <span id="our-moments-title">
            A lookback at what we&apos;ve built together
          </span>
        }
      />

      <LazyMotion features={domAnimation}>
        <div className={timelineShellClasses}>
          <div className={lineClasses} aria-hidden />
          <ol className={timelineClasses}>
            {MOMENTS.map((moment, index) => (
              <TimelineEntry
                key={moment.id}
                moment={moment}
                index={index}
                reducedMotion={reducedMotion}
              />
            ))}
          </ol>
        </div>
      </LazyMotion>
    </section>
  )
}
