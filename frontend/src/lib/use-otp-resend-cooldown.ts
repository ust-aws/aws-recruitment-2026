import { useCallback, useEffect, useState } from "react"

export function useOtpResendCooldown(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds)

  const restart = useCallback(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) return
    const id = window.setTimeout(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)
    return () => window.clearTimeout(id)
  }, [remaining])

  return { remaining, canResend: remaining <= 0, restart }
}
