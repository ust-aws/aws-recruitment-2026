import type {
  CommitteeValues,
  GeneralInfoValues,
  PrivacyValues,
  UploadValues,
} from "@/components/apply/apply-schema"
import type { CreateApplicationInput } from "@/lib/types/application"
import {
  APPLY_MISSING_DOCUMENTS_ERROR,
  APPLY_UNEXPECTED_ERROR,
  isApplicantUploadFailureMessage,
} from "@/lib/api/error-message"
import { formatContactDigits, sanitizeSectionInput } from "@/lib/apply/field-validation"
import { needsCreativesPortfolio, needsDevelopmentGithub } from "@/lib/apply/committee"

/** Converts validated form values into the API's create-application payload. */
export function toCreateApplicationInput(
  privacy: PrivacyValues,
  general: GeneralInfoValues,
  committee: CommitteeValues,
  _upload: UploadValues,
  emailDomain: string,
  uploadSessionId: string,
): CreateApplicationInput {
  const positionApplication = committee.applicationType === "position"
  const needsPortfolio = positionApplication && needsCreativesPortfolio(
    committee.firstCommittee,
    committee.secondCommittee,
  )
  const needsGithub = positionApplication && needsDevelopmentGithub(
    committee.firstCommittee,
    committee.secondCommittee,
    committee.firstPositionTitle,
    committee.secondPositionTitle,
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
    applicationType: committee.applicationType,
    ...(positionApplication ? { slotId: committee.slotId } : {}),
    ...(needsPortfolio ? { portfolioUrl: committee.portfolioUrl.trim() } : {}),
    ...(needsGithub && committee.githubUrl.trim()
      ? { githubUrl: committee.githubUrl.trim() }
      : {}),
    choices: positionApplication
      ? [
          { positionId: committee.firstPositionId, preferenceRank: 1 },
          { positionId: committee.secondPositionId, preferenceRank: 2 },
        ]
      : [],
    uploadSessionId,
  }
}

function isMissingDocumentsMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("please attach") ||
    lower.includes("must attach") ||
    lower.includes("missing document") ||
    ((lower.includes("required") || lower.includes("required field")) &&
      (lower.includes("resume") ||
        lower.includes("registration") ||
        lower.includes("curriculum")))
  )
}

/** Maps API failures that cannot be attached to one local field. */
export function mapApplyApiError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("dataprivacy") || lower.includes("data privacy")) {
    return "You must agree to the Data Privacy Agreement to continue."
  }
  if (lower.includes("already submitted") || lower.includes("one application per year") || lower.includes("recruitment cycle")) {
    return "You already applied for this recruitment cycle with this UST email. Only one application per year is allowed."
  }
  if (isApplicantUploadFailureMessage(message)) {
    return APPLY_UNEXPECTED_ERROR
  }
  if (isMissingDocumentsMessage(message)) {
    return APPLY_MISSING_DOCUMENTS_ERROR
  }
  return APPLY_UNEXPECTED_ERROR
}
