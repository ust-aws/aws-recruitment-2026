"use client"

import { type FormEvent, useState } from "react"
import { Check } from "lucide-react"
import { ApplicantCodeForm } from "@/components/apply/applicant-code-form"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestApplicantCode } from "@/lib/applicant-auth-api"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import {
  fieldControlClasses,
  glassPanelClasses,
} from "@/lib/surface"

const panelClasses = `mx-auto mt-10 w-full max-w-xl ${glassPanelClasses} px-6 py-8 md:px-10`
const formClasses = "flex flex-col gap-5"
const emailWrapClasses =
  "flex h-12 overflow-hidden rounded-[20px] bg-haiti/70 focus-within:ring-2 focus-within:ring-aquamarine/30"
const emailInputClasses =
  "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-sm text-blue-chalk shadow-none focus-visible:ring-0"
const domainClasses = "flex shrink-0 items-center pr-4 text-sm text-prelude"
const submitClasses = "mt-2 h-10 px-5 text-xs"
const messageClasses = "text-sm leading-relaxed text-prelude"
const errorClasses = "text-sm text-aquamarine"
const verifiedClasses = "flex flex-col items-center gap-4 text-center"
const checkClasses =
  "flex size-12 items-center justify-center rounded-full bg-aquamarine text-haiti"

type Identity = {
  applicationCode: string
  email: string
}

export function ApplicantAccessForm() {
  const [stage, setStage] = useState<"identity" | "code" | "verified">(
    "identity"
  )
  const [applicationCode, setApplicationCode] = useState("")
  const [emailLocal, setEmailLocal] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const identity: Identity = {
    applicationCode: applicationCode.trim().toUpperCase(),
    email: `${emailLocal.trim().toLowerCase()}${UST_EMAIL_DOMAIN}`,
  }

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setError("")
    setPending(true)
    try {
      const result = await requestApplicantCode(identity)
      setMessage(result.message)
      setStage("code")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not request a verification code."
      )
    } finally {
      setPending(false)
    }
  }

  if (stage === "verified") {
    return (
      <section className={panelClasses} aria-live="polite">
        <div className={verifiedClasses}>
          <div className={checkClasses}>
            <Check className="size-6" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-chalk">
              Verification successful
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-prelude">
              We confirmed your identity for {identity.applicationCode}.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (stage === "code") {
    return (
      <ApplicantCodeForm
        identity={identity}
        message={message}
        onBack={() => {
          setError("")
          setStage("identity")
        }}
        onVerified={() => setStage("verified")}
      />
    )
  }

  return (
    <section className={panelClasses}>
      <form className={formClasses} onSubmit={requestCode}>
        <Field label="Application ID" htmlFor="applicationCode" required>
          <Input
            id="applicationCode"
            name="applicationCode"
            autoComplete="off"
            required
            pattern="AP-[0-9]{4}-[0-9]{6}"
            maxLength={14}
            placeholder="AP-2026-123456"
            value={applicationCode}
            onChange={(event) =>
              setApplicationCode(event.target.value.toUpperCase())
            }
            className={fieldControlClasses}
          />
        </Field>
        <Field label="UST Email" htmlFor="applicantEmail" required>
          <div className={emailWrapClasses}>
            <Input
              id="applicantEmail"
              name="applicantEmail"
              autoComplete="email"
              required
              placeholder="juan.delacruz"
              value={emailLocal}
              onChange={(event) =>
                setEmailLocal(event.target.value.replace(/@.*$/, ""))
              }
              className={emailInputClasses}
            />
            <span className={domainClasses}>{UST_EMAIL_DOMAIN}</span>
          </div>
        </Field>
        {error ? (
          <p className={errorClasses} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          color="cyan"
          className={submitClasses}
          disabled={pending}
        >
          {pending ? "Sending…" : "Send verification code"}
        </Button>
        <p className={messageClasses}>
          The code expires after 10 minutes. For your security, we won’t say
          whether an Application ID or email exists.
        </p>
      </form>
    </section>
  )
}
