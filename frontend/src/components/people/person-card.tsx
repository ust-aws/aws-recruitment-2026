"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"
import { ImageLightbox } from "@/components/shared/image-lightbox"
import { personAvatarImageProps } from "@/lib/site/public-gallery-image"
import { PERSON_AVATAR_PLACEHOLDER, type PersonTerm } from "@/lib/people"
import { cn } from "@/lib/utils"

const cardClasses =
  "glass flex h-full min-h-[18rem] flex-col items-center rounded-[28px] border border-blue-chalk/20 bg-meteorite/45 px-5 py-8 text-center"
const stageClasses =
  "relative w-full overflow-hidden select-none touch-pan-y"
const contentClasses = "flex w-full flex-col items-center"
const avatarClasses =
  "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-biloba-flower/35 bg-daisy-bush/30"
const nameClasses = "mt-5 font-sans text-lg font-bold leading-tight text-blue-chalk"
const titleClasses =
  "mt-1 flex min-h-12 max-w-[11rem] items-center justify-center font-sans text-sm font-semibold leading-snug text-aquamarine"
const yearClasses = "mt-1 font-sans text-xs text-prelude"
const pagerClasses = "mt-auto flex items-center gap-3 pt-6"
const pagerSpacerClasses = "mt-auto min-h-8 pt-6"
const pagerButtonClasses =
  "flex size-8 cursor-pointer items-center justify-center rounded-full border border-blue-chalk/25 bg-haiti/40 text-prelude transition-[background-color,border-color,box-shadow,transform,color] duration-300 ease-out hover:-translate-y-0.5 hover:border-aquamarine/50 hover:bg-aquamarine/15 hover:text-aquamarine hover:shadow-[0_0_16px_rgba(90,240,192,0.35)] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-blue-chalk/25 disabled:hover:bg-haiti/40 disabled:hover:text-prelude disabled:hover:shadow-none"
const pagerLabelClasses = "min-w-[2.5rem] font-mono text-xs text-prelude"

const termSpring = { type: "spring" as const, stiffness: 420, damping: 34 }
const termSnap = { duration: 0 }
const swipeDistance = 48
const swipeThreshold = 40

function termVariants(reducedMotion: boolean | null) {
  if (reducedMotion) {
    return {
      enter: { opacity: 1, x: 0 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 1, x: 0 },
    }
  }
  return {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction * swipeDistance,
    }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction * -swipeDistance,
    }),
  }
}

type PersonCardProps = {
  terms: PersonTerm[]
  showPager?: boolean
}

export function PersonCard({ terms, showPager = false }: PersonCardProps) {
  const reducedMotion = useReducedMotion()
  const [termIndex, setTermIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const person = terms[termIndex] ?? terms[0]
  const photoSrc = person.photo ?? PERSON_AVATAR_PLACEHOLDER
  const canExpandPhoto = Boolean(person.photo)
  const photoStyle = person.photoObjectPosition
    ? { objectPosition: person.photoObjectPosition }
    : undefined
  const termCount = terms.length
  const atStart = termIndex <= 0
  const atEnd = termIndex >= termCount - 1

  function showPreviousTerm() {
    if (atStart) return
    setDirection(-1)
    setTermIndex((current) => current - 1)
  }

  function showNextTerm() {
    if (atEnd) return
    setDirection(1)
    setTermIndex((current) => current + 1)
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!showPager) return
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!showPager || !swipeStart.current) return

    const deltaX = event.clientX - swipeStart.current.x
    const deltaY = event.clientY - swipeStart.current.y
    swipeStart.current = null

    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) {
      return
    }

    if (deltaX > 0) {
      showNextTerm()
      return
    }

    showPreviousTerm()
  }

  function onPointerCancel() {
    swipeStart.current = null
  }

  return (
    <article className={cardClasses}>
      <div
        className={cn(stageClasses, showPager && "cursor-grab active:cursor-grabbing")}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
      >
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={`${person.academicYear}-${person.name}`}
              custom={direction}
              variants={termVariants(reducedMotion)}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reducedMotion ? termSnap : termSpring}
              className={contentClasses}
            >
              <div className={avatarClasses}>
                {canExpandPhoto ? (
                  <ImageLightbox
                    src={photoSrc}
                    alt={person.name}
                    title={person.name}
                    triggerAriaLabel={`View full photo of ${person.name}`}
                    onTriggerPointerDown={(event) => event.stopPropagation()}
                    triggerClassName="size-full"
                    unoptimized
                  >
                    <Image
                      src={photoSrc}
                      alt=""
                      className="size-full object-cover"
                      style={photoStyle}
                      unoptimized
                      {...personAvatarImageProps}
                    />
                  </ImageLightbox>
                ) : (
                  <Image
                    src={photoSrc}
                    alt=""
                    className="size-full object-cover"
                    style={photoStyle}
                    {...personAvatarImageProps}
                  />
                )}
              </div>
              <h3 className={nameClasses}>{person.name}</h3>
              <p className={titleClasses}>{person.title}</p>
              <p className={yearClasses}>{person.academicYear}</p>
            </m.div>
          </AnimatePresence>
        </LazyMotion>
      </div>

      {showPager ? (
        <div className={pagerClasses}>
          <button
            type="button"
            className={pagerButtonClasses}
            aria-label="Previous term"
            disabled={atStart}
            onClick={showPreviousTerm}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className={pagerLabelClasses}>
            {termIndex + 1}/{termCount}
          </span>
          <button
            type="button"
            className={cn(pagerButtonClasses)}
            aria-label="Next term"
            disabled={atEnd}
            onClick={showNextTerm}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      ) : (
        <div className={pagerSpacerClasses} aria-hidden />
      )}
    </article>
  )
}
