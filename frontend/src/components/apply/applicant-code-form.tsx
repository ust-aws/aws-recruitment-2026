"use client"

import { useState } from "react"
import { Field } from "@/components/shared/field"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  requestApplicantCode,
  verifyApplicantCode,
  type ApplicantIdentity,
} from "@/lib/api/applicant-auth"
import { APPLICANT_OTP_RESEND_SECONDS } from "@/lib/constants"
import {
  glassPanelClasses,
  ghostPillButtonClasses,
} from "@/lib/site/surface"
import { useOtpResendCooldown } from "@/hooks/use-otp-resend-cooldown"

const panelClasses = `mx-auto mt-10 w-full max-w-xl ${glassPanelClasses} px-6 py-8 md:px-10`
const formClasses = "flex flex-col gap-5"
const submitClasses = "mt-2 h-10 px-5 text-xs"
const messageClasses = "text-sm leading-relaxed text-prelude"
const errorClasses = "text-sm text-rose-glow"
const resendButtonClasses =
  "h-auto px-0 text-xs text-prelude hover:text-blue-chalk"
const resendCooldownClasses = "text-xs text-prelude/70"

type ApplicantCodeFormProps = {
  identity: ApplicantIdentity
  message: string
  onBack: () => void
  onVerified: () => void
}

export function ApplicantCodeForm({
  identity,
  message,
  onBack,
  onVerified,
}: ApplicantCodeFormProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const { remaining, canResend, restart } = useOtpResendCooldown(
    APPLICANT_OTP_RESEND_SECONDS
  )

  async function verifyCode() {
    setError("")
    setPending(true)
    try {
      await verifyApplicantCode({ ...identity, code })
      onVerified()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not verify this code."
      )
    } finally {
      setPending(false)
    }
  }

  async function requestAnotherCode() {
    if (!canResend) return
    setError("")
    setPending(true)
    try {
      await requestApplicantCode(identity)
      restart()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not request another verification code."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={panelClasses}>
      <form
        className={formClasses}
        onSubmit={(event) => {
          event.preventDefault()
          void verifyCode()
        }}
      >
        <div>
          <h2 className="text-xl font-bold text-blue-chalk">
            Check your UST email
          </h2>
          <p className={`mt-2 ${messageClasses}`}>{message}</p>
        </div>
        <Field label="Six-digit verification code" htmlFor="otp" required>
          <InputOTP
            id="otp"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={setCode}
            containerClassName="justify-center"
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </Field>
        {error ? (
          <p className={errorClasses} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          color="cyan"
          className={submitClasses}
          disabled={pending || code.length !== 6}
          onClick={() => void verifyCode()}
        >
          {pending ? "Verifying…" : "Verify code"}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            color="purple"
            className={ghostPillButtonClasses}
            onClick={onBack}
          >
            Change details
          </Button>
          {canResend ? (
            <Button
              type="button"
              variant="link"
              color={null}
              className={resendButtonClasses}
              onClick={() => void requestAnotherCode()}
              disabled={pending}
            >
              Request another code
            </Button>
          ) : (
            <p className={resendCooldownClasses} aria-live="polite">
              Request another code in {remaining}s
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
