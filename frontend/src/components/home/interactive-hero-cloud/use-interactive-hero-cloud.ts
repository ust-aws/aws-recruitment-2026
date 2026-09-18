"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import {
  type CloudExpression,
  frowningMouthPath,
  getExpression,
  hurtReactionDuration,
  isPrimaryNavigationTab,
  neutralMouthPath,
  rapidClickThreshold,
  rapidClickWindow,
  rainCooldownDuration,
  rainDuration,
  smilingMouthPath,
} from "./constants"

export function useInteractiveHeroCloud() {
  const cloudRef = useRef<HTMLButtonElement>(null)
  const faceRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const hurtTimeoutRef = useRef<number | null>(null)
  const rainTimeoutRef = useRef<number | null>(null)
  const rainCooldownTimeoutRef = useRef<number | null>(null)
  const recentClickTimesRef = useRef<number[]>([])
  const rainOnCooldownRef = useRef(false)
  const currentPositionRef = useRef({ x: 0, y: 0 })
  const targetPositionRef = useRef({ x: 0, y: 0 })
  const pointerExpressionRef = useRef<CloudExpression>("neutral")
  const focusExpressionRef = useRef<CloudExpression>("neutral")
  const [expression, setExpression] = useState<CloudExpression>("neutral")
  const [isHurt, setIsHurt] = useState(false)
  const [isRaining, setIsRaining] = useState(false)
  const [showClickHint, setShowClickHint] = useState(true)
  const isUpset = isHurt || isRaining
  const mouthPath = isUpset
    ? frowningMouthPath
    : expression === "smile"
      ? smilingMouthPath
      : expression === "frown"
        ? frowningMouthPath
        : neutralMouthPath

  function syncExpression() {
    setExpression(
      pointerExpressionRef.current !== "neutral"
        ? pointerExpressionRef.current
        : focusExpressionRef.current
    )
  }

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

  function triggerHurtReaction() {
    if (hurtTimeoutRef.current !== null) {
      window.clearTimeout(hurtTimeoutRef.current)
    }
    setShowClickHint(false)
    setIsHurt(true)
    hurtTimeoutRef.current = window.setTimeout(() => {
      setIsHurt(false)
      hurtTimeoutRef.current = null
    }, hurtReactionDuration)
  }

  function triggerRain() {
    rainOnCooldownRef.current = true
    setIsRaining(true)
    rainTimeoutRef.current = window.setTimeout(() => {
      setIsRaining(false)
      rainTimeoutRef.current = null
    }, rainDuration)
    rainCooldownTimeoutRef.current = window.setTimeout(() => {
      rainOnCooldownRef.current = false
      rainCooldownTimeoutRef.current = null
    }, rainCooldownDuration)
  }

  function handleCloudClick() {
    triggerHurtReaction()

    const now = Date.now()
    const recentClickTimes = recentClickTimesRef.current.filter(
      (time) => now - time < rapidClickWindow
    )
    recentClickTimes.push(now)
    recentClickTimesRef.current = recentClickTimes

    if (
      !rainOnCooldownRef.current &&
      recentClickTimes.length >= rapidClickThreshold
    ) {
      recentClickTimesRef.current = []
      triggerRain()
    }
  }

  const handlePointerMove = useEffectEvent(
    (event: globalThis.PointerEvent) => {
      const pointerExpression =
        event.pointerType === "touch" ? "neutral" : getExpression(event.target)
      if (pointerExpressionRef.current !== pointerExpression) {
        pointerExpressionRef.current = pointerExpression
        syncExpression()
      }

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

  const handlePointerLeave = useEffectEvent(() => {
    pointerExpressionRef.current = "neutral"
    syncExpression()
    resetFace()
  })

  const handleNavigationClick = useEffectEvent(
    (event: globalThis.MouseEvent) => {
      if (!isPrimaryNavigationTab(event.target)) return
      pointerExpressionRef.current = "neutral"
      focusExpressionRef.current = "neutral"
      syncExpression()
    }
  )

  const handleFocusIn = useEffectEvent((event: globalThis.FocusEvent) => {
    focusExpressionRef.current = getExpression(event.target)
    syncExpression()
  })

  const handleFocusOut = useEffectEvent((event: globalThis.FocusEvent) => {
    focusExpressionRef.current = getExpression(event.relatedTarget)
    syncExpression()
  })

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerleave", handlePointerLeave)
    window.addEventListener("click", handleNavigationClick)
    window.addEventListener("focusin", handleFocusIn)
    window.addEventListener("focusout", handleFocusOut)
    window.addEventListener("resize", handlePointerLeave)
    window.addEventListener("scroll", handlePointerLeave, { passive: true })

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
      window.removeEventListener("click", handleNavigationClick)
      window.removeEventListener("focusin", handleFocusIn)
      window.removeEventListener("focusout", handleFocusOut)
      window.removeEventListener("resize", handlePointerLeave)
      window.removeEventListener("scroll", handlePointerLeave)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (hurtTimeoutRef.current !== null) {
        window.clearTimeout(hurtTimeoutRef.current)
      }
      if (rainTimeoutRef.current !== null) {
        window.clearTimeout(rainTimeoutRef.current)
      }
      if (rainCooldownTimeoutRef.current !== null) {
        window.clearTimeout(rainCooldownTimeoutRef.current)
      }
    }
  }, [])

  return {
    cloudRef,
    faceRef,
    handleCloudClick,
    isHurt,
    isRaining,
    isUpset,
    mouthPath,
    showClickHint,
  }
}
