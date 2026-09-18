import { useCallback, useEffect, useState } from "react"

export function useOtpResendCooldown(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds)

  const restart = useCallback(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return { remaining, canResend: remaining <= 0, restart }
}
