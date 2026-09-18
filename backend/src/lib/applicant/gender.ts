export const APPLICANT_GENDER_VALUES = ["male", "female"] as const;

export type ApplicantGender = (typeof APPLICANT_GENDER_VALUES)[number];

export function isApplicantGender(value: string): value is ApplicantGender {
  return (APPLICANT_GENDER_VALUES as readonly string[]).includes(value);
}

export function parseApplicantGender(value: unknown): ApplicantGender | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  return isApplicantGender(trimmed) ? trimmed : null;
}
