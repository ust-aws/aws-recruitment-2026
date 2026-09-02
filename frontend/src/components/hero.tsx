"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useEffectEvent, useRef } from "react"
import { Button } from "@/components/ui/button"

const heroClasses =
  "relative left-1/2 -mt-16 mb-[-40px] flex min-h-[calc(100svh-10rem)] w-screen -translate-x-1/2 overflow-hidden bg-cover bg-center text-center"
const overlayClasses =
  "absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(23,15,51,0.1),rgba(42,18,89,0.03)_50%,rgba(23,15,51,0.2))]"
const contentClasses =
  "relative mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-[1180px] flex-col items-center justify-between pt-16"
const artworkClasses =
  "flex w-full shrink-0 flex-col items-center"
const titleClasses =
  "z-10 h-[clamp(190px,34vw,340px)] w-[min(100vw,1040px)] overflow-visible max-md:h-[clamp(175px,32vh,235px)] max-[700px]:h-[clamp(155px,34vw,205px)]"
const cloudClasses =
  "relative z-20 -mt-[clamp(5rem,12vw,10rem)] aspect-square w-[clamp(260px,30vw,400px)] max-md:w-[clamp(210px,58vw,320px)] max-[700px]:-mt-[clamp(4rem,12vw,5.5rem)] max-[700px]:w-[clamp(190px,56vw,280px)]"
const cloudImageClasses = "absolute inset-0 h-full w-full object-contain"
const lowerContentClasses =
  "z-30 flex w-[min(94vw,720px)] flex-col items-center pb-[clamp(1.125rem,2.5vh,1.75rem)]"
const informationClasses =
  "flex w-full flex-col items-center gap-[clamp(1.25rem,2.5vh,2rem)]"
const descriptionClasses =
  "w-[min(88vw,640px)] text-xs leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(23,15,51,0.5)] sm:text-sm md:text-base"
const buttonRowClasses =
  "flex w-full flex-wrap items-center justify-center gap-2 sm:gap-4"
const buttonClasses =
  "h-11 px-5 text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none sm:h-12 sm:px-6 sm:text-base max-sm:h-10 max-sm:px-3 max-sm:text-xs"
const purpleButtonEffectClasses =
  "hover:shadow-[0_0_24px_rgba(183,140,240,0.45)]"
const cyanButtonEffectClasses =
  "hover:shadow-[0_0_24px_rgba(90,240,192,0.45)]"
const scrollClasses =
  "mt-[clamp(1.25rem,4vh,4rem)] flex flex-col items-center font-mono text-[clamp(0.7rem,1vw,0.9rem)] uppercase tracking-[0.2em] text-white"
const scrollArrowClasses = "mt-2 block text-xl leading-none sm:text-2xl"

export function Hero() {
  const cloudRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLImageElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentPositionRef = useRef({ x: 0, y: 0 })
  const targetPositionRef = useRef({ x: 0, y: 0 })

  function animateFace() {
    const face = faceRef.current
    if (!face) {
      animationFrameRef.current = null
      return
    }

    const current = currentPositionRef.current
    const target = targetPositionRef.current
    current.x += (target.x - current.x) * 0.16
    current.y += (target.y - current.y) * 0.16

    face.style.transform =
      "translate3d(" + current.x + "px, " + current.y + "px, 0)"

    if (
      Math.abs(target.x - current.x) < 0.1 &&
      Math.abs(target.y - current.y) < 0.1
    ) {
      current.x = target.x
      current.y = target.y
      face.style.transform =
        "translate3d(" + target.x + "px, " + target.y + "px, 0)"
      animationFrameRef.current = null
      return
    }

    animationFrameRef.current = requestAnimationFrame(animateFace)
  }

  function queueFaceAnimation() {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(animateFace)
    }
  }

  const resetFace = useEffectEvent(() => {
    targetPositionRef.current = { x: 0, y: 0 }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      currentPositionRef.current = { x: 0, y: 0 }
      if (faceRef.current) {
        faceRef.current.style.transform = "translate3d(0, 0, 0)"
      }
      return
    }

    queueFaceAnimation()
  })

  const handlePointerMove = useEffectEvent(
    (event: globalThis.PointerEvent) => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches

      if (event.pointerType === "touch" || reducedMotion) {
        if (reducedMotion) resetFace()
        return
      }

      const cloud = cloudRef.current
      if (!cloud) return

      const bounds = cloud.getBoundingClientRect()
      const centerX = bounds.left + bounds.width / 2
      const centerY = bounds.top + bounds.height / 2
      const horizontalRatio =
        (event.clientX - centerX) / (bounds.width * 0.5)
      const verticalRatio =
        (event.clientY - centerY) / (bounds.height * 0.5)
      const horizontalLimit = Math.min(40, Math.max(25, bounds.width * 0.074))
      const downwardLimit = Math.min(60, Math.max(30, bounds.width * 0.11))
      const upwardLimit = Math.min(24, Math.max(14, bounds.width * 0.045))
      const clampedHorizontal = Math.max(-1, Math.min(1, horizontalRatio))
      const clampedVertical = Math.max(-1, Math.min(1, verticalRatio))
      const isUpperRight = clampedHorizontal > 0 && clampedVertical < 0
      const upperRightHorizontalLimit = Math.min(
        28,
        Math.max(18, bounds.width * 0.052)
      )
      const upperRightUpwardLimit = Math.min(
        20,
        Math.max(12, bounds.width * 0.038)
      )

      targetPositionRef.current = {
        x:
          clampedHorizontal *
          (isUpperRight ? upperRightHorizontalLimit : horizontalLimit),
        y:
          clampedVertical < 0
            ? clampedVertical *
              (isUpperRight ? upperRightUpwardLimit : upwardLimit)
            : clampedVertical * downwardLimit,
      }
      queueFaceAnimation()
    }
  )

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerleave", resetFace)
    window.addEventListener("resize", resetFace)
    window.addEventListener("scroll", resetFace, { passive: true })

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", resetFace)
      window.removeEventListener("resize", resetFace)
      window.removeEventListener("scroll", resetFace)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  return (
    <section
      aria-labelledby="hero-title"
      className={heroClasses}
      style={{ backgroundImage: "url('/hero/hero-background.png')" }}
    >
      <div aria-hidden="true" className={overlayClasses} />
      <div className={contentClasses}>
        <div className={artworkClasses}>
          <h1
            id="hero-title"
            aria-label="What's in the Clouds?"
            className={titleClasses}
          >
            <svg
              aria-hidden="true"
              className="h-full w-full overflow-visible"
              viewBox="0 0 1200 400"
              role="presentation"
            >
              <defs>
                <path id="hero-title-arch" d="M 100 350 Q 600 -110 1100 350" />
              </defs>
              <text
                fill="white"
                fontFamily="var(--font-poppins), sans-serif"
                fontSize="105"
                fontWeight="700"
                letterSpacing="1"
                textAnchor="middle"
              >
                <textPath href="#hero-title-arch" startOffset="50%">
                  What&apos;s in the Clouds?
                </textPath>
              </text>
            </svg>
          </h1>

          <div
            ref={cloudRef}
            className={cloudClasses}
            aria-label="A cloud with an interactive face"
            role="img"
          >
            <Image
              src="/hero/cloud.png"
              alt=""
              fill
              sizes="(max-width: 640px) 58vw, (max-width: 768px) 34vw, 540px"
              className={cloudImageClasses}
              draggable={false}
            />
            <Image
              ref={faceRef}
              src="/hero/cloud-face.png"
              alt=""
              fill
              sizes="(max-width: 640px) 58vw, (max-width: 768px) 34vw, 540px"
              className={`${cloudImageClasses} will-change-transform`}
              draggable={false}
            />
          </div>
        </div>

        <div className={lowerContentClasses}>
          <div className={informationClasses}>
            <p className={descriptionClasses}>
              We&apos;re a student-led cloud &amp; AI community at the University of Santo Tomas
              &mdash; part of a global network of builders across the Philippines and beyond.
            </p>

            <div className={buttonRowClasses}>
              <Button
                color="purple"
                render={<a href="#committees" aria-label="Find your committee" />}
                nativeButton={false}
                className={`${buttonClasses} ${purpleButtonEffectClasses}`}
              >
                Find your committee
              </Button>
              <Button
                color="cyan"
                className={`${buttonClasses} ${cyanButtonEffectClasses}`}
                nativeButton={false}
                render={<Link href="/apply" />}
              >
                Apply now!
              </Button>
              <Button color="purple" className={`${buttonClasses} ${purpleButtonEffectClasses}`}>
                Know more about us!
              </Button>
            </div>
          </div>

          <p className={scrollClasses}>
            Scroll down <span className={scrollArrowClasses}>↓</span>
          </p>
        </div>
      </div>
    </section>
  )
}
