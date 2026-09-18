"use client"

import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import { SectionHeader } from "@/components/shared/section-header"
import { OurMomentsTimelineEntry } from "@/components/home/our-moments-timeline-entry"
import { ABOUT_EVENTS } from "@/lib/site/about-events"

const sectionClasses = "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)]"
const timelineShellClasses = "relative mx-auto w-full max-w-5xl"
const lineClasses =
  "pointer-events-none absolute top-2 bottom-2 left-1/2 w-px -translate-x-1/2 bg-biloba-flower/25"
const timelineClasses = "flex flex-col"

export function OurMoments() {
  const reducedMotion = useReducedMotion()

  return (
    <section
      id="our-moments"
      aria-labelledby="our-moments-title"
      className={`${sectionClasses} scroll-mt-20`}
    >
      <SectionHeader
        eyebrow="// events"
        title={
          <span id="our-moments-title">
            Workshops and Milestones
          </span>
        }
      />

      <LazyMotion features={domAnimation}>
        <div className={timelineShellClasses}>
          <div className={lineClasses} aria-hidden />
          <ol className={timelineClasses}>
            {ABOUT_EVENTS.map((event, index) => (
              <OurMomentsTimelineEntry
                key={event.id}
                event={event}
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
