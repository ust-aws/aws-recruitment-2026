"use client"

import { Field } from "@/components/field"
import type { PrivacyValues } from "@/components/apply/apply-schema"
import { cn } from "@/lib/utils"

const stackClasses = "flex flex-col gap-5"
const copyClasses =
  "font-sans text-sm leading-relaxed text-prelude [&_strong]:text-blue-chalk"
const optionWrapClasses =
  "flex cursor-pointer items-start gap-3 rounded-[20px] border border-biloba-flower/35 bg-haiti/35 px-4 py-4 transition-colors"
const optionActiveClasses = "border-aquamarine/50 bg-haiti/55"
const radioClasses =
  "mt-0.5 size-4 shrink-0 accent-aquamarine"
const optionLabelClasses = "font-sans text-sm text-blue-chalk"

type PrivacyStepProps = {
  values: PrivacyValues
  onChange: (patch: Partial<PrivacyValues>) => void
  errors?: Partial<Record<keyof PrivacyValues, string>>
}

export function PrivacyStep({ values, onChange, errors }: PrivacyStepProps) {
  const agreed = values.dataPrivacyAgreed

  return (
    <div className={stackClasses}>
      <Field label="Data Privacy Agreement" required error={errors?.dataPrivacyAgreed}>
        <p className={copyClasses}>
          By accepting this Data Privacy Statement, I am granting my free,
          voluntary and unconditional consent to the researchers to treat the
          data I gave for research functions only and in accordance with
          Republic Act (R.A.) 10173, otherwise known as the &quot;Data Privacy
          Act of 2012&quot; of the Republic of the Philippines, including its
          Implementing Rules and Regulations (IRR) as well as all other
          guidelines and issuances by the National Privacy Commission (NPC).
        </p>
      </Field>
      <label
        className={cn(optionWrapClasses, agreed && optionActiveClasses)}
      >
        <input
          type="radio"
          name="dataPrivacyAgreed"
          className={radioClasses}
          checked={agreed}
          onChange={() => onChange({ dataPrivacyAgreed: true })}
        />
        <span className={optionLabelClasses}>I agree</span>
      </label>
    </div>
  )
}
