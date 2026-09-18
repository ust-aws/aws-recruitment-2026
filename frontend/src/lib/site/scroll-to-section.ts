import { requestSectionReveal } from "@/lib/site/reveal-section-event"

const targetCorrectionDelay = 100
const maxTargetCorrections = 20

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth"
}

function findSectionTarget(id: string) {
  return document.getElementById(id)
}

function isDeferredPlaceholder(target: HTMLElement) {
  return target.getAttribute("aria-hidden") === "true"
}

function scrollToTarget(target: HTMLElement, behavior = scrollBehavior()) {
  target.scrollIntoView({ behavior, block: "start" })
}

export function scrollToSection(id: string) {
  requestSectionReveal(id)

  const initialTarget = findSectionTarget(id)
  if (initialTarget && !isDeferredPlaceholder(initialTarget)) {
    scrollToTarget(initialTarget)
    return
  }

  let sawAnchor = Boolean(initialTarget)
  let correctionCount = 0

  function correctTargetPosition() {
    const target = findSectionTarget(id)
    if (target) {
      sawAnchor = true
      scrollToTarget(target, correctionCount === 0 ? scrollBehavior() : "instant")
    }

    correctionCount += 1
    if (correctionCount >= maxTargetCorrections) {
      if (!sawAnchor) {
        window.scrollTo({ top: 0, behavior: scrollBehavior() })
      }
      return
    }

    window.setTimeout(correctTargetPosition, targetCorrectionDelay)
  }

  correctTargetPosition()
}