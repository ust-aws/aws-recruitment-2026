import type {
  CommitteeValues,
  GeneralInfoValues,
  PrivacyValues,
  UploadValues,
} from "@/components/apply/apply-schema"
import type { CreateApplicationInput } from "@/lib/application-types"
import { formatContactDigits, sanitizeSectionInput } from "@/lib/apply-field-validation"
import { needsCreativesPortfolio, needsDevelopmentGithub } from "@/lib/committee-apply"

/** Converts validated form values into the API's create-application payload. */
export function toCreateApplicationInput(
  privacy: PrivacyValues,
  general: GeneralInfoValues,
  committee: CommitteeValues,
  _upload: UploadValues,
  emailDomain: string,
  uploadSessionId: string,
): CreateApplicationInput {
  const needsPortfolio = needsCreativesPortfolio(
    committee.firstCommittee,
    committee.secondCommittee,
  )
  const needsGithub = needsDevelopmentGithub(
    committee.firstCommittee,
    committee.secondCommittee,
  )

  return {
    firstName: general.firstName.trim(),
    lastName: general.lastName.trim(),
    email: `${general.emailLocal.trim()}${emailDomain}`,
    age: Number(general.age),
    birthday: general.birthday,
    gender: general.gender,
    section: sanitizeSectionInput(general.section),
    studentNumber: general.studentNumber.trim(),
    contactNumber: formatContactDigits(general.contactDigits),
    facebookUrl: general.facebookUrl.trim(),
    dataPrivacyAgreed: privacy.dataPrivacyAgreed,
    motivation: committee.motivation.trim(),
    slotId: committee.slotId,
    ...(needsPortfolio ? { portfolioUrl: committee.portfolioUrl.trim() } : {}),
    ...(needsGithub && committee.githubUrl.trim()
      ? { githubUrl: committee.githubUrl.trim() }
      : {}),
    choices: [
      { positionId: committee.firstPositionId, preferenceRank: 1 },
      { positionId: committee.secondPositionId, preferenceRank: 2 },
    ],
    uploadSessionId,
  }
}

/** Maps API failures that cannot be attached to one local field. */
export function mapApplyApiError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("dataprivacy") || lower.includes("data privacy")) {
    return "You must agree to the Data Privacy Agreement to continue."
  }
  if (lower.includes("document") || lower.includes("resume") || lower.includes("transcript") || lower.includes("registration") || lower.includes("s3key")) {
    return "Please attach your Curriculum Vitae, Transcript of Records, and Registration Form."
  }
  if (lower.includes("already submitted") || lower.includes("one application per year") || lower.includes("recruitment cycle")) {
    return "You already applied for this recruitment cycle with this UST email. Only one application per year is allowed."
  }
  return message
}
