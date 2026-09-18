"use client"

import Image from "next/image"
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"
import {
  cloudClasses,
  cloudImageClasses,
  layerClasses,
  mouthSnap,
  restingStormAnimation,
  stormShakeAnimation,
  stormShakeTransition,
} from "./constants"
import { cn } from "@/lib/utils"
import { HeroCloudClickHint } from "./hero-cloud-click-hint"
import { HeroCloudFace } from "./hero-cloud-face"
import { HeroCloudRain } from "./hero-cloud-rain"
import { useInteractiveHeroCloud } from "./use-interactive-hero-cloud"

export function InteractiveHeroCloud() {
  const reducedMotion = useReducedMotion()
  const {
    cloudRef,
    faceRef,
    handleCloudClick,
    isHurt,
    isRaining,
    isUpset,
    mouthPath,
    showClickHint,
  } = useInteractiveHeroCloud()

  return (
    <button
      ref={cloudRef}
      type="button"
      data-interactive-hero-cloud
      className={cloudClasses}
      aria-label="Click the cloud for a reaction"
      onClick={handleCloudClick}
    >
      {showClickHint ? <HeroCloudClickHint /> : null}
      {isRaining ? <HeroCloudRain reducedMotion={reducedMotion} /> : null}
      <LazyMotion features={domAnimation}>
        <m.div
          className={cn(layerClasses, "will-change-transform")}
          animate={
            isRaining && !reducedMotion
              ? stormShakeAnimation
              : restingStormAnimation
          }
          initial={false}
          transition={
            isRaining && !reducedMotion ? stormShakeTransition : mouthSnap
          }
        >
          <Image
            src="/hero/cloud.png"
            alt=""
            fill
            loading="lazy"
            quality={85}
            sizes="(max-width: 640px) 58vw, (max-width: 768px) 34vw, 540px"
            className={cn(
              cloudImageClasses,
              isRaining && "grayscale brightness-[.65] contrast-125",
            )}
            draggable={false}
          />
        </m.div>
      </LazyMotion>
      <HeroCloudFace
        faceRef={faceRef}
        isHurt={isHurt}
        isRaining={isRaining}
        isUpset={isUpset}
        mouthPath={mouthPath}
        reducedMotion={reducedMotion}
      />
    </button>
  )
}
