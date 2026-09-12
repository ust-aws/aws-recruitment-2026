"use client"

import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field } from "@/components/field"
import {
  APPLICANT_GENDER_OPTIONS,
  formatApplicantGender,
} from "@/lib/applicant-gender"
import { sanitizeSectionInput } from "@/lib/apply-field-validation"
import { fieldControlClasses } from "@/lib/surface"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import type { GeneralInfoValues } from "@/components/apply/apply-schema"

const gridClasses = "grid gap-5 sm:grid-cols-2"
const personalRowClasses = "grid gap-5 sm:col-span-2 sm:grid-cols-3"
const sectionEmailRowClasses = "grid gap-5 sm:grid-cols-2 sm:col-span-2"
const selectTriggerClasses = `${fieldControlClasses} justify-between`
const composedWrapClasses =
  "flex h-12 items-center overflow-hidden rounded-[20px] bg-haiti/70 focus-within:ring-2 focus-within:ring-aquamarine/30"
const composedInputClasses =
  "h-12 min-h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 py-0 font-sans text-sm leading-normal text-blue-chalk shadow-none placeholder:text-prelude/60 focus-visible:border-0 focus-visible:ring-0"
const composedAffixClasses =
  "flex h-12 shrink-0 items-center font-sans text-sm text-prelude"
const composedPrefixClasses = `${composedAffixClasses} border-r border-blue-chalk/20 pl-4 pr-3`
const composedSuffixClasses = `${composedAffixClasses} border-l border-blue-chalk/20 pl-3 pr-4`

type GeneralInfoStepProps = {
  values: GeneralInfoValues
  onChange: (patch: Partial<GeneralInfoValues>) => void
  errors?: Partial<Record<keyof GeneralInfoValues, string>>
}

function lettersOnly(value: string) {
  return value.replace(/[^\p{L}\s'-]/gu, "")
}

function positiveDigits(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits === "" || Number(digits) <= 0) return ""
  return String(Number(digits))
}

function studentDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10)
}

function contactDigitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 10)
}

export function GeneralInfoStep({ values, onChange, errors }: GeneralInfoStepProps) {
  return (
    <div className={gridClasses}>
      <Field label="First Name" htmlFor="firstName" required error={errors?.firstName}>
        <Input
          id="firstName"
          name="firstName"
          required
          autoComplete="given-name"
          placeholder="Juan"
          inputMode="text"
          value={values.firstName}
          onChange={(e) => onChange({ firstName: lettersOnly(e.target.value) })}
          className={fieldControlClasses}
        />
      </Field>
      <Field label="Last Name" htmlFor="lastName" required error={errors?.lastName}>
        <Input
          id="lastName"
          name="lastName"
          required
          autoComplete="family-name"
          placeholder="Dela Cruz"
          inputMode="text"
          value={values.lastName}
          onChange={(e) => onChange({ lastName: lettersOnly(e.target.value) })}
          className={fieldControlClasses}
        />
      </Field>
      <div className={personalRowClasses}>
        <Field label="Age" htmlFor="age" required error={errors?.age}>
          <Input
            id="age"
            name="age"
            required
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
        <Field label="Birthday" htmlFor="birthday" required error={errors?.birthday}>
          <DatePicker
            id="birthday"
            required
            value={values.birthday}
            onChange={(birthday) => onChange({ birthday })}
            placeholder="Select birthday"
          />
        </Field>
        <Field label="Gender" htmlFor="gender" required error={errors?.gender}>
          <Select
            value={values.gender || null}
            onValueChange={(gender: string | null) =>
              onChange({ gender: gender ?? "" })
            }
          >
            <SelectTrigger
              id="gender"
              className={selectTriggerClasses}
              aria-required="true"
            >
              <SelectValue placeholder="Select gender">
                {values.gender
                  ? formatApplicantGender(values.gender)
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {APPLICANT_GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Student Number" htmlFor="studentNumber" required error={errors?.studentNumber}>
        <Input
          id="studentNumber"
          name="studentNumber"
          required
          inputMode="numeric"
          minLength={10}
          maxLength={10}
          placeholder="2023123456"
          value={values.studentNumber}
          onChange={(e) =>
            onChange({ studentNumber: studentDigits(e.target.value) })
          }
          className={fieldControlClasses}
        />
      </Field>
      <Field label="Contact Number" htmlFor="contactDigits" required error={errors?.contactDigits}>
        <div className={composedWrapClasses}>
          <span className={composedPrefixClasses} aria-hidden="true">
            +63
          </span>
          <Input
            id="contactDigits"
            name="contactDigits"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            minLength={10}
            maxLength={10}
            placeholder="9171234567"
            value={values.contactDigits}
            onChange={(e) =>
              onChange({ contactDigits: contactDigitsOnly(e.target.value) })
            }
            className={composedInputClasses}
          />
        </div>
      </Field>
      <div className={sectionEmailRowClasses}>
        <Field label="Year & Section" htmlFor="section" required error={errors?.section}>
          <Input
            id="section"
            name="section"
            required
            value={values.section}
            placeholder="4CSC"
            minLength={4}
            maxLength={4}
            onChange={(e) =>
              onChange({ section: sanitizeSectionInput(e.target.value) })
            }
            className={fieldControlClasses}
          />
        </Field>
        <Field label="UST Email" htmlFor="emailLocal" required error={errors?.emailLocal}>
          <div className={composedWrapClasses}>
            <Input
              id="emailLocal"
              name="emailLocal"
              required
              autoComplete="username"
              placeholder="juan.delacruz"
              value={values.emailLocal}
              onChange={(e) =>
                onChange({
                  emailLocal: e.target.value.replace(/@.*$/, ""),
                })
              }
              className={composedInputClasses}
            />
            <span className={composedSuffixClasses}>{UST_EMAIL_DOMAIN}</span>
          </div>
        </Field>
      </div>
      <Field
        label="Facebook Profile Link"
        htmlFor="facebookUrl"
        required
        className="sm:col-span-2"
        error={errors?.facebookUrl}
      >
        <Input
          id="facebookUrl"
          name="facebookUrl"
          required
          type="url"
          inputMode="url"
          placeholder="https://facebook.com/your.profile"
          value={values.facebookUrl}
          onChange={(e) => onChange({ facebookUrl: e.target.value })}
          className={fieldControlClasses}
        />
      </Field>
    </div>
  )
}
