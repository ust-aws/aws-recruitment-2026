"use client"

import Image from "next/image"
import { m } from "motion/react"
import { ImageLightbox } from "@/components/shared/image-lightbox"
import type { AboutEvent } from "@/lib/site/about-events"
import { eventTimelineImageProps } from "@/lib/site/public-gallery-image"
import { cn } from "@/lib/utils"

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
  "relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-[14px] border border-blue-chalk/20 bg-meteorite/45"
const mediaImageClasses = "object-cover"

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
  event: AboutEvent
  index: number
  reducedMotion: boolean | null
}

function TimelineEntryDot({ reducedMotion }: { reducedMotion: boolean | null }) {
  return (
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
  )
}

function TimelineEntryDesktopCopy({
  event,
  mediaOnRight,
  reducedMotion,
}: {
  event: AboutEvent
  mediaOnRight: boolean
  reducedMotion: boolean | null
}) {
  const copyEnterX = mediaOnRight ? -20 : 20
  return (
    <m.div
      className={cn(
        descriptionColClasses,
        mediaOnRight ? descriptionColRightClasses : descriptionColLeftClasses,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 16, x: copyEnterX }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={reducedMotion ? revealSnap : { ...revealEase, delay: 0.06 }}
    >
      <p className={descriptionClasses}>{event.description}</p>
    </m.div>
  )
}

function TimelineEntryMedia({
  event,
  mediaOnRight,
  reducedMotion,
}: {
  event: AboutEvent
  mediaOnRight: boolean
  reducedMotion: boolean | null
}) {
  const mediaEnterX = mediaOnRight ? 28 : -28
  return (
    <m.article
      className={cn(
        mediaColClasses,
        mediaOnRight ? mediaColRightClasses : mediaColLeftClasses,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 24, x: mediaEnterX }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={reducedMotion ? revealSnap : revealEase}
    >
      <p className={dateClasses}>
        {event.dateLabel}
      </p>
      <p className={labelClasses}>{event.title}</p>
      <p className={cn(descriptionClasses, descriptionMobileClasses)}>
        {event.description}
      </p>
      <m.div
        className={mediaClasses}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
        whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={
          reducedMotion ? revealSnap : { ...revealEase, delay: 0.12 }
        }
      >
        <ImageLightbox
          src={event.imageSrc}
          alt={event.title}
          title={event.title}
          triggerAriaLabel={`View full photo of ${event.title}`}
          triggerClassName="relative block size-full"
          unoptimized
        >
          <Image
            src={event.imageSrc}
            alt=""
            fill
            className={mediaImageClasses}
            {...eventTimelineImageProps}
          />
        </ImageLightbox>
      </m.div>
    </m.article>
  )
}

export function OurMomentsTimelineEntry({
  event,
  index,
  reducedMotion,
}: TimelineEntryProps) {
  const mediaOnRight = index % 2 === 0
  return (
    <li className={entryClasses}>
      <TimelineEntryDot reducedMotion={reducedMotion} />
      <div className={entryGridClasses}>
        <TimelineEntryDesktopCopy
          event={event}
          mediaOnRight={mediaOnRight}
          reducedMotion={reducedMotion}
        />
        <TimelineEntryMedia
          event={event}
          mediaOnRight={mediaOnRight}
          reducedMotion={reducedMotion}
        />
      </div>
    </li>
  )
}
