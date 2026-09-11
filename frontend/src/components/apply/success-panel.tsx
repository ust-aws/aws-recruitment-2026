import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isDevelopmentCommittee } from "@/lib/committee-apply"

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
  firstChoiceCommittee?: string
  secondChoiceCommittee?: string
}

export function SuccessPanel({
  applicationCode,
  firstChoiceCommittee = "",
  secondChoiceCommittee = "",
}: SuccessPanelProps) {
  const devExam =
    isDevelopmentCommittee(firstChoiceCommittee) ||
    isDevelopmentCommittee(secondChoiceCommittee)

  return (
    <div className={contentClasses}>
      <div className={checkWrapClasses}>
        <Check className="size-6" strokeWidth={3} />
      </div>
      <h2 className={titleClasses}>Application submitted!</h2>
      <p className={bodyClasses}>
        Thanks for applying to AWS Builders - UST! Save your Application ID:
      </p>
      <p className="mt-2 font-mono text-base font-semibold tracking-wide text-blue-chalk">
        {applicationCode}
      </p>
      <p className={bodyClasses}>
        Please prepare <span className={emphasisClasses}>₱250</span> for the
        membership fee when you join.
      </p>
      {devExam ? (
        <p className={bodyClasses}>
          Because you applied to the{" "}
          <span className={emphasisClasses}>Development Committee</span>, you
          will undergo a{" "}
          <span className={emphasisClasses}>special exam</span> as part of
          recruitment.
        </p>
      ) : null}
      <p className={bodyClasses}>
        We&apos;ll reach out once R101 review wraps up.
      </p>
      <p className={bodyClasses}>
        If you wish to edit your application,{" "}
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
