export const APPLICANT_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const

export type ApplicantGender = (typeof APPLICANT_GENDER_OPTIONS)[number]["value"]

const labelByValue = new Map(
  APPLICANT_GENDER_OPTIONS.map((option) => [option.value, option.label])
)

export function isApplicantGender(value: string): value is ApplicantGender {
  return labelByValue.has(value as ApplicantGender)
}

export function formatApplicantGender(value: string | null | undefined) {
  if (!value) return "—"
  return labelByValue.get(value as ApplicantGender) ?? value
}
