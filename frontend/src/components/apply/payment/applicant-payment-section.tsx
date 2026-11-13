import type { ReactNode } from "react"

// A numbered step inside the payment section. The number stays because the
// order matters: pay first, then submit the receipt.
const stepClasses = "grid min-w-0 gap-x-4 border-t border-blue-chalk/10 pt-5 sm:grid-cols-[2.5rem_1fr]"
const numberClasses = "font-mono text-sm text-prelude"
const titleClasses = "font-sans text-base font-semibold text-blue-chalk"
const descriptionClasses = "mt-1 font-sans text-sm leading-relaxed text-pretty text-prelude"
const bodyClasses = "mt-4 min-w-0"

export function ApplicantPaymentSection({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className={stepClasses}>
      <span className={numberClasses} aria-hidden>
        {number}
      </span>
      <div className="min-w-0">
        <h4 className={titleClasses}>{title}</h4>
        <p className={descriptionClasses}>{description}</p>
        {children ? <div className={bodyClasses}>{children}</div> : null}
      </div>
    </div>
  )
}
