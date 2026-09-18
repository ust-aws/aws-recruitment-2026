"use client"

import { m } from "motion/react"
import { cn } from "@/lib/utils"
import {
  SPLASH_CLOUD_TINTS,
  SPLASH_CURTAIN_LAYERS,
  type SplashCurtainLayer,
} from "@/lib/site/home-splash-cloud-layout"

const stageClasses = "pointer-events-none absolute inset-0 z-0 overflow-hidden"
const puffBaseClasses = "absolute"
const puffMask = {
  WebkitMaskImage: 'url("/hero/cloud.png")',
  maskImage: 'url("/hero/cloud.png")',
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
} as const
const leftInnerClasses = "relative h-full w-full"
const rightInnerClasses = "relative h-full w-full -scale-x-100"
const curtainFillClasses =
  "absolute inset-y-[-14%] left-[-22%] w-[118%] bg-meteorite"

type HomeSplashCloudsProps = {
  exiting: boolean
  fadeOnly: boolean
  duration: number
}

function CurtainPanel({
  side,
  layer,
  exiting,
  fadeOnly,
  duration,
}: {
  side: "left" | "right"
  layer: SplashCurtainLayer
  exiting: boolean
  fadeOnly: boolean
  duration: number
}) {
  const travel = `${side === "left" ? "-" : ""}${layer.travelVw}vw`

  return (
    <m.div
      className={cn(
        "absolute inset-y-0 will-change-transform",
        side === "left" ? "left-0" : "right-0",
        layer.widthClass,
      )}
      initial={false}
      animate={
        fadeOnly
          ? { opacity: 0 }
          : exiting
            ? { x: travel }
            : { x: 0 }
      }
      transition={{
        duration: fadeOnly ? 0.25 : duration,
        delay: fadeOnly ? 0 : layer.delay,
        ease: [0.45, 0, 0.12, 1],
      }}
    >
      <div className={side === "right" ? rightInnerClasses : leftInnerClasses}>
        {layer.id === "back" ? <div className={curtainFillClasses} /> : null}
        {layer.puffs.map((puff) => (
          <div
            key={`${side}-${puff.id}`}
            className={cn(puffBaseClasses, SPLASH_CLOUD_TINTS[puff.tint])}
            style={{
              ...puffMask,
              left: `${puff.left}%`,
              top: `${puff.top}%`,
              width: `${puff.width}%`,
              height: `${puff.height}%`,
              transform: `rotate(${puff.rotate}deg)`,
            }}
          />
        ))}
      </div>
    </m.div>
  )
}

export function HomeSplashClouds({
  exiting,
  fadeOnly,
  duration,
}: HomeSplashCloudsProps) {
  return (
    <div className={stageClasses} aria-hidden>
      {SPLASH_CURTAIN_LAYERS.map((layer) => (
        <CurtainPanel
          key={`l-${layer.id}`}
          side="left"
          layer={layer}
          exiting={exiting}
          fadeOnly={fadeOnly}
          duration={duration}
        />
      ))}
      {SPLASH_CURTAIN_LAYERS.map((layer) => (
        <CurtainPanel
          key={`r-${layer.id}`}
          side="right"
          layer={layer}
          exiting={exiting}
          fadeOnly={fadeOnly}
          duration={duration}
        />
      ))}
    </div>
  )
}
