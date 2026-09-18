"use client"

import Image from "next/image"
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react"
import { createPortal, preload } from "react-dom"
import { m, useReducedMotion } from "motion/react"
import { HomeSplashClouds } from "@/components/home/splash-clouds"
import {
  HOME_SPLASH_EXIT_MS,
  HOME_SPLASH_MAX_WAIT_MS,
  HOME_SPLASH_MIN_HOLD_MS,
  clearHomeSplashActiveLock,
  markHomeSplashSeen,
  shouldSkipHomeSplashClient,
} from "@/lib/site/home-splash"

const overlayClasses =
  "home-splash-overlay fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
const centerClasses =
  "relative z-20 flex size-[min(78vw,20rem)] items-center justify-center"
const espiHaloClasses =
  "absolute size-[min(82vw,22rem)] rounded-full bg-[radial-gradient(circle,var(--haiti)_12%,transparent_70%)]"
const espiWrapClasses = "relative size-[min(56vw,12.5rem)]"
const ringClasses = "absolute inset-0 -m-2 size-[calc(100%+1rem)]"
const srOnlyClasses = "sr-only"

type SplashPhase = "loading" | "exiting" | "done"

function subscribeToSkipFlag() {
  return () => {}
}

function getSkipFlagSnapshot() {
  return shouldSkipHomeSplashClient()
}

function getSkipFlagServerSnapshot() {
  return true
}

function LoadingRing({ reducedMotion }: { reducedMotion: boolean | null }) {
  return (
    <svg className={ringClasses} viewBox="0 0 100 100" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(183, 140, 240, 0.4)"
        strokeWidth="3.5"
      />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#5AF0C0"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="70 220"
        className={
          reducedMotion
            ? undefined
            : "origin-center animate-[home-splash-ring_1.1s_linear_infinite]"
        }
      />
    </svg>
  )
}

export function HomeSplash() {
  preload("/hero/cloud.png", { as: "image" })
  const skip = useSyncExternalStore(
    subscribeToSkipFlag,
    getSkipFlagSnapshot,
    getSkipFlagServerSnapshot,
  )
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<SplashPhase>("loading")

  useLayoutEffect(() => {
    clearHomeSplashActiveLock()
  }, [skip])

  useEffect(() => {
    if (skip || phase !== "loading") return

    const startedAt = Date.now()
    let finished = false

    function completeLoading() {
      if (finished) return
      finished = true
      if (reducedMotion) {
        markHomeSplashSeen()
        clearHomeSplashActiveLock()
        setPhase("done")
        return
      }
      setPhase("exiting")
    }

    function maybeComplete() {
      const elapsed = Date.now() - startedAt
      if (elapsed >= HOME_SPLASH_MIN_HOLD_MS) {
        completeLoading()
      }
    }

    maybeComplete()
    window.addEventListener("load", maybeComplete)
    const poll = window.setInterval(maybeComplete, 80)
    const cap = window.setTimeout(completeLoading, HOME_SPLASH_MAX_WAIT_MS)

    return () => {
      window.removeEventListener("load", maybeComplete)
      window.clearInterval(poll)
      window.clearTimeout(cap)
    }
  }, [skip, phase, reducedMotion])

  useEffect(() => {
    if (skip || phase === "done") return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [skip, phase])

  useEffect(() => {
    if (phase !== "exiting") return
    const timeout = window.setTimeout(() => {
      markHomeSplashSeen()
      clearHomeSplashActiveLock()
      setPhase("done")
    }, HOME_SPLASH_EXIT_MS + 180)
    return () => window.clearTimeout(timeout)
  }, [phase])

  if (skip || phase === "done") return null

  const exitSeconds = HOME_SPLASH_EXIT_MS / 1000
  const fadeOnly = Boolean(reducedMotion)
  const exiting = phase === "exiting"

  const overlay = (
    <m.div
      className={overlayClasses}
      role="status"
      aria-busy={phase === "loading"}
      aria-live="polite"
      initial={false}
      animate={{ backgroundColor: exiting ? "rgba(23, 15, 51, 0)" : "#170f33" }}
      transition={{ duration: fadeOnly ? 0.25 : exitSeconds, ease: "easeInOut" }}
    >
      <p className={srOnlyClasses}>Loading AWS Builders – UST</p>
      <HomeSplashClouds
        exiting={exiting}
        fadeOnly={fadeOnly}
        duration={exitSeconds}
      />

      <m.div
        className={centerClasses}
        initial={false}
        animate={
          fadeOnly
            ? { opacity: 0 }
            : exiting
              ? { scale: 1.45, opacity: 0 }
              : { scale: 1, opacity: 1 }
        }
        transition={{ duration: fadeOnly ? 0.25 : exitSeconds * 0.7, ease: "easeOut" }}
      >
        <div className={espiHaloClasses} aria-hidden />
        <LoadingRing reducedMotion={reducedMotion} />
        <div className={espiWrapClasses}>
          <Image
            src="/espi.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 56vw, 12.5rem"
            className="object-contain"
          />
        </div>
      </m.div>
    </m.div>
  )

  return createPortal(overlay, document.body)
}
