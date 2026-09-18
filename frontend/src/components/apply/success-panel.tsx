import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { needsDevExamSuccessCopy } from "@/lib/apply/committee"

const contentClasses =
  "flex flex-col items-center px-4 py-6 text-center md:px-8 md:py-8"
const checkWrapClasses =
  "mb-5 flex size-12 items-center justify-center rounded-full bg-biloba-flower text-haiti"
const titleClasses = "font-sans text-2xl font-bold text-blue-chalk md:text-3xl"
const bodyClasses = "mt-3 max-w-sm font-sans text-sm leading-relaxed text-prelude"
const emphasisClasses = "font-semibold text-blue-chalk"
const linkClasses =
  "font-semibold text-blue-chalk underline-offset-4 hover:text-aquamarine hover:underline"
const actionsClasses = "mt-8 flex flex-col items-center gap-3 sm:flex-row"
const buttonClasses = "h-10 px-5 text-xs"

type SuccessPanelProps = {
  applicationCode: string
  applicationType: "position" | "member"
  firstChoiceCommittee?: string
  secondChoiceCommittee?: string
  firstChoiceTitle?: string
  secondChoiceTitle?: string
}

export function SuccessPanel({
  applicationCode,
  applicationType,
  firstChoiceCommittee = "",
  secondChoiceCommittee = "",
  firstChoiceTitle = "",
  secondChoiceTitle = "",
}: SuccessPanelProps) {
  const positionApplication = applicationType === "position"
  const examCopy = needsDevExamSuccessCopy(
    firstChoiceCommittee,
    secondChoiceCommittee,
    firstChoiceTitle,
    secondChoiceTitle,
  )

  return (
    <div className={contentClasses}>
      <div className={checkWrapClasses}>
        <Check className="size-6" strokeWidth={3} />
      </div>
      <h2 className={titleClasses}>Application submitted!</h2>
      <p className={bodyClasses}>
        {positionApplication
          ? "Thanks for applying to AWS Builders - UST! Save your Application ID:"
          : "Thanks for registering as a member! Save your Application ID:"}
      </p>
      <p className="mt-2 font-mono text-base font-semibold tracking-wide text-blue-chalk">
        {applicationCode}
      </p>
      <p className={bodyClasses}>
        Check your <span className={emphasisClasses}>UST email</span> for
        {positionApplication
          ? " a confirmation of your application."
          : " confirmation that your membership registration was accepted."}
      </p>
      <p className={bodyClasses}>
        {positionApplication
          ? <>Please prepare <span className={emphasisClasses}>₱250</span> for the membership fee when you join.</>
          : <>Membership payment will open after <span className={emphasisClasses}>R101</span>. Please wait for the official instructions and do not send a payment yet.</>}
      </p>
      {positionApplication && examCopy.development ? (
        <p className={bodyClasses}>
          Because you applied to the{" "}
          <span className={emphasisClasses}>Development Committee</span>, you
          will undergo a{" "}
          <span className={emphasisClasses}>special exam</span> as part of
          recruitment.
        </p>
      ) : null}
      {positionApplication && examCopy.ctoEa ? (
        <p className={bodyClasses}>
          Because you applied as the{" "}
          <span className={emphasisClasses}>Executive Assistant to the CTO</span>
          , you will undergo a{" "}
          <span className={emphasisClasses}>special exam</span> as part of
          recruitment.
        </p>
      ) : null}
      <p className={bodyClasses}>
        {positionApplication
          ? "We will reach out once R101 review wraps up."
          : "We will email the payment details once the payment period opens."}
      </p>
      <p className={bodyClasses}>
        {positionApplication ? "If you wish to edit your application," : "You can review your registration status"}{" "}
        <Link href="/apply/status" className={linkClasses}>
          log in to your dashboard
        </Link>{" "}
        with this Application ID and your UST email.
      </p>
      <div className={actionsClasses}>
        <Button
          color="cyan"
          className={buttonClasses}
          nativeButton={false}
          render={<Link href="/apply/status" />}
        >
          Go to dashboard
        </Button>
        <Button
          color="purple"
          className={buttonClasses}
          nativeButton={false}
          render={<Link href="/apply/positions" />}
        >
          Browse open positions
        </Button>
      </div>
    </div>
  )
}
