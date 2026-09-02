"use client"

import { Input } from "@/components/ui/input"
import { Field } from "@/components/field"
import { cn } from "@/lib/utils"
import { fieldControlClasses } from "@/lib/surface"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"

const gridClasses = "grid gap-5 sm:grid-cols-2"
const ageRowClasses = "grid gap-5 sm:grid-cols-[5.5rem_1fr_1.4fr]"
const emailWrapClasses =
  "flex h-12 overflow-hidden rounded-[20px] bg-haiti/70 focus-within:ring-2 focus-within:ring-aquamarine/30"
const emailInputClasses =
  "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-sm text-blue-chalk shadow-none focus-visible:ring-0"
const domainClasses =
  "flex shrink-0 items-center pr-4 font-sans text-sm text-prelude"

export type GeneralInfoValues = {
  firstName: string
  lastName: string
  age: string
  section: string
  emailLocal: string
}

type GeneralInfoStepProps = {
  values: GeneralInfoValues
  onChange: (patch: Partial<GeneralInfoValues>) => void
}

function lettersOnly(value: string) {
  return value.replace(/[^\p{L}\s'-]/gu, "")
}

function positiveDigits(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits === "" || Number(digits) <= 0) return ""
  return String(Number(digits))
}

export function GeneralInfoStep({ values, onChange }: GeneralInfoStepProps) {
  return (
    <div className={gridClasses}>
      <Field label="First Name" htmlFor="firstName" required>
        <Input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          placeholder="Juan"
          inputMode="text"
          value={values.firstName}
          onChange={(e) => onChange({ firstName: lettersOnly(e.target.value) })}
          className={fieldControlClasses}
        />
      </Field>
      <Field label="Last Name" htmlFor="lastName" required>
        <Input
          id="lastName"
          name="lastName"
          autoComplete="family-name"
          placeholder="Dela Cruz"
          inputMode="text"
          value={values.lastName}
          onChange={(e) => onChange({ lastName: lettersOnly(e.target.value) })}
          className={fieldControlClasses}
        />
      </Field>
      <div className={cn(ageRowClasses, "sm:col-span-2")}>
        <Field label="Age" htmlFor="age" required>
          <Input
            id="age"
            name="age"
            type="text"
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            min={1}
            placeholder="21"
            value={values.age}
            onChange={(e) => onChange({ age: positiveDigits(e.target.value) })}
            className={fieldControlClasses}
          />
        </Field>
        <Field label="Year & Section" htmlFor="section" required>
          <Input
            id="section"
            name="section"
            value={values.section}
            placeholder="3ISB"
            onChange={(e) => onChange({ section: e.target.value })}
            className={fieldControlClasses}
          />
        </Field>
        <Field label="UST Email" htmlFor="emailLocal" required>
          <div className={emailWrapClasses}>
            <Input
              id="emailLocal"
              name="emailLocal"
              autoComplete="username"
              placeholder="juan.delacruz"
              value={values.emailLocal}
              onChange={(e) =>
                onChange({
                  emailLocal: e.target.value.replace(/@.*$/, ""),
                })
              }
              className={emailInputClasses}
            />
            <span className={domainClasses}>{UST_EMAIL_DOMAIN}</span>
          </div>
        </Field>
      </div>
    </div>
  )
}
