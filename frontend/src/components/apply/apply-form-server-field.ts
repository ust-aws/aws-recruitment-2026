import type { UseFormSetError } from "react-hook-form"
import type { ApplyFormValues } from "@/components/apply/apply-schema"
import { mapApplyApiError } from "@/components/apply/form-model"
import {
  APPLY_MISSING_DOCUMENTS_ERROR,
  APPLY_UNEXPECTED_ERROR,
  isApplicantUploadFailureMessage,
} from "@/lib/api/error-message"

type FormStep = 1 | 2 | 3 | 4 | 5 | 6

type ServerFieldName =
  | "privacy.dataPrivacyAgreed"
  | "general.firstName"
  | "general.studentNumber"
  | "general.contactDigits"
  | "general.facebookUrl"
  | "general.age"
  | "general.birthday"
  | "general.gender"
  | "general.section"
  | "general.emailLocal"
  | "committee.portfolioUrl"
  | "committee.githubUrl"
  | "committee.firstPositionId"
  | "committee.slotId"
  | "upload.resume"

function serverFieldForMessage(message: string): {
  name: ServerFieldName
  step: FormStep
} | null {
  const lower = message.toLowerCase()
  if (lower.includes("dataprivacy") || lower.includes("data privacy")) {
    return { name: "privacy.dataPrivacyAgreed", step: 1 }
  }
  if (lower.includes("firstname") || lower.includes("lastname")) {
    return { name: "general.firstName", step: 2 }
  }
  if (lower.includes("studentnumber")) {
    return { name: "general.studentNumber", step: 2 }
  }
  if (lower.includes("contactnumber")) {
    return { name: "general.contactDigits", step: 2 }
  }
  if (lower.includes("facebookurl")) {
    return { name: "general.facebookUrl", step: 2 }
  }
  if (lower.includes("age")) return { name: "general.age", step: 2 }
  if (lower.includes("birthday")) return { name: "general.birthday", step: 2 }
  if (lower.includes("gender")) return { name: "general.gender", step: 2 }
  if (lower.includes("section")) return { name: "general.section", step: 2 }
  if (
    lower.includes("emaillocal") ||
    lower.includes("ust email") ||
    (lower.includes("email") &&
      (lower.includes("invalid") ||
        lower.includes("required") ||
        lower.includes("must be") ||
        lower.includes("already")))
  ) {
    return { name: "general.emailLocal", step: 2 }
  }
  if (lower.includes("portfolio")) {
    return { name: "committee.portfolioUrl", step: 3 }
  }
  if (lower.includes("github")) return { name: "committee.githubUrl", step: 3 }
  if (lower.includes("choice") || lower.includes("position")) {
    return { name: "committee.firstPositionId", step: 3 }
  }
  if (lower.includes("slot") || lower.includes("interview")) {
    return { name: "committee.slotId", step: 3 }
  }
  return null
}

export function applyMappedServerError(
  message: string,
  setError: UseFormSetError<ApplyFormValues>,
  setStep: (step: FormStep) => void,
  setServerError: (message: string) => void,
  hasRequiredDocuments: boolean,
) {
  if (!hasRequiredDocuments) {
    const missing = APPLY_MISSING_DOCUMENTS_ERROR
    setError("upload.resume", { type: "server", message: missing })
    setError("upload.registration", { type: "server", message: missing })
    setServerError(missing)
    return
  }
  if (isApplicantUploadFailureMessage(message)) {
    setServerError(APPLY_UNEXPECTED_ERROR)
    return
  }
  const displayMessage = mapApplyApiError(message)
  const target = serverFieldForMessage(message)
  if (target && displayMessage !== APPLY_UNEXPECTED_ERROR) {
    setError(target.name, { type: "server", message: displayMessage })
    setStep(target.step)
    return
  }
  setServerError(displayMessage)
}
