export const interactiveElementSelector = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "summary",
  '[role="button"]:not([aria-disabled="true"])',
  '[role="link"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export const primaryNavigationLinkSelector = 'a[data-href]'
export const cloudSelector = '[data-interactive-hero-cloud]'
export const cloudClasses =
  "hero-cloud-float relative z-20 -mt-[clamp(5rem,12vw,10rem)] aspect-square w-[clamp(260px,30vw,400px)] cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/70 max-md:w-[clamp(210px,58vw,320px)] max-[700px]:-mt-[clamp(4rem,12vw,5.5rem)] max-[700px]:w-[clamp(190px,56vw,280px)]"
export const layerClasses = "absolute inset-0 h-full w-full object-contain"
export const cloudImageClasses =
  `${layerClasses} transition-[filter] duration-300 motion-reduce:transition-none`
export const clickHintClasses =
  "pointer-events-none absolute -right-6 top-[12%] z-30 animate-pulse rounded-pill border border-biloba-flower/40 bg-meteorite/85 px-3 py-1 font-mono text-[0.625rem] text-blue-chalk shadow-[0_6px_16px_rgba(23,15,51,0.35)] before:absolute before:-bottom-2 before:left-4 before:size-2 before:rounded-full before:border before:border-biloba-flower/40 before:bg-meteorite/85 after:absolute after:-bottom-4 after:left-2.5 after:size-1 after:rounded-full after:bg-meteorite/85 max-md:-right-4 max-md:px-2 max-md:text-[0.55rem]"
export const rainContainerClasses =
  "pointer-events-none absolute inset-x-[15%] top-[62%] z-[-1] h-[70%] overflow-hidden"
export const rainDropClasses =
  "absolute top-0 h-6 w-px rounded-pill bg-blue-chalk/85 shadow-[0_0_6px_rgba(183,140,240,0.8)]"
export const lightningBoltClasses =
  "absolute top-[4%] h-28 w-14 text-blue-chalk drop-shadow-[0_0_12px_rgba(90,240,192,0.9)]"
export const rainDrops = [
  { left: "5%", delay: 0.12, duration: 0.68 },
  { left: "14%", delay: 0.36, duration: 0.76 },
  { left: "25%", delay: 0.04, duration: 0.72 },
  { left: "36%", delay: 0.28, duration: 0.82 },
  { left: "47%", delay: 0.18, duration: 0.7 },
  { left: "58%", delay: 0.42, duration: 0.78 },
  { left: "68%", delay: 0.08, duration: 0.74 },
  { left: "78%", delay: 0.32, duration: 0.8 },
  { left: "89%", delay: 0.22, duration: 0.7 },
] as const
export const lightningBolts = [
  { left: "24%", delay: 0.18, duration: 0.82 },
  { left: "62%", delay: 0.72, duration: 0.9 },
] as const
export const neutralMouthPath = "M 918 1190 Q 1168 1190 1418 1190"
export const smilingMouthPath = "M 910 1158 Q 1168 1420 1428 1158"
export const frowningMouthPath = "M 910 1222 Q 1168 960 1428 1222"
export const hurtReactionDuration = 650
export const rapidClickThreshold = 4
export const rapidClickWindow = 2_000
export const rainDuration = 2_800
export const rainCooldownDuration = 6_000
export const rainDropAnimation = {
  y: ["0%", "1800%"],
  opacity: [0, 1, 0],
}
export const reducedMotionRainDropAnimation = { opacity: 0.7 }
export const lightningAnimation = {
  opacity: [0, 1, 0, 0.85, 0],
  scale: [0.9, 1, 1, 1.08, 0.9],
}
export const reducedMotionLightningAnimation = { opacity: 0.8 }
export const normalFaceColor = "rgb(93 55 166)"
export const stormFaceColor = "rgb(31 41 55)"
export const hurtFaceAnimation = {
  x: [0, -4, 3, -2, 1, 0],
  y: [0, 2, -2, 1, 0],
  scaleX: [1, 1.08, 0.97, 1.03, 1],
  scaleY: [1, 0.92, 1.04, 0.98, 1],
  rotate: 0,
}
export const restingFaceAnimation = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
}
export const stormShakeAnimation = {
  x: [0, -3, 3, -3, 3, -2, 2, 0],
  rotate: [0, -1, 1, -1, 1, -0.5, 0.5, 0],
}
export const restingStormAnimation = { x: 0, rotate: 0 }
export const stormFaceAnimation = {
  ...stormShakeAnimation,
  y: 0,
  scaleX: 1,
  scaleY: 1,
}
export const stormShakeTransition = {
  duration: 0.4,
  ease: "linear" as const,
  repeat: 6,
}
export const hurtTransition = {
  type: "tween" as const,
  duration: 0.5,
  ease: [0.36, 0, 0.66, -0.56] as const,
}
export const mouthTransition = {
  type: "tween" as const,
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1] as const,
}
export const mouthSnap = { duration: 0 }

export function heroCloudFaceColor(isRaining: boolean) {
  return isRaining ? stormFaceColor : normalFaceColor
}

export function heroCloudFaceMotion(
  isHurt: boolean,
  isRaining: boolean,
  reducedMotion: boolean | null,
) {
  if (!reducedMotion && isRaining) {
    return { animation: stormFaceAnimation, transition: stormShakeTransition }
  }
  if (!reducedMotion && isHurt) {
    return { animation: hurtFaceAnimation, transition: hurtTransition }
  }
  return { animation: restingFaceAnimation, transition: mouthSnap }
}

export type CloudExpression = "neutral" | "smile" | "frown"

export function isPrimaryNavigationTab(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest(primaryNavigationLinkSelector))
  )
}

export function getExpression(target: EventTarget | null): CloudExpression {
  if (!(target instanceof Element)) return "neutral"
  if (target.closest(cloudSelector)) return "neutral"
  if (isPrimaryNavigationTab(target)) return "frown"
  return target.closest(interactiveElementSelector) ? "smile" : "neutral"
}
