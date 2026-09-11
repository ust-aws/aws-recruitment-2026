import type { GeneralInfoValues } from "@/components/apply/general-info-step"

import type { CommitteeValues } from "@/components/apply/committee-step"

import type { PrivacyValues } from "@/components/apply/privacy-step"



const STORAGE_KEY = "aws-ust-apply-draft"



export type ApplyFormDraft = {

  step: 1 | 2 | 3 | 4 | 5

  privacy: PrivacyValues

  general: GeneralInfoValues

  committee: CommitteeValues

  resumeName?: string

  transcriptName?: string

  registrationName?: string

}



function isStep(value: unknown): value is ApplyFormDraft["step"] {

  return (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5
  )

}



function isPrivacy(values: unknown): values is PrivacyValues {

  if (!values || typeof values !== "object") return false

  return typeof (values as PrivacyValues).dataPrivacyAgreed === "boolean"

}



function isGeneral(values: unknown): values is GeneralInfoValues {

  if (!values || typeof values !== "object") return false

  const v = values as Record<string, unknown>

  return (

    typeof v.firstName === "string" &&

    typeof v.lastName === "string" &&

    typeof v.age === "string" &&

    typeof (v.birthday ?? "") === "string" &&

    typeof (v.gender ?? "") === "string" &&

    typeof v.section === "string" &&

    typeof v.emailLocal === "string" &&

    typeof (v.studentNumber ?? "") === "string" &&

    typeof (v.contactDigits ?? "") === "string" &&

    typeof (v.facebookUrl ?? "") === "string"

  )

}



function isCommittee(values: unknown): values is CommitteeValues {

  if (!values || typeof values !== "object") return false

  const v = values as Record<string, unknown>

  return (

    typeof v.firstCommittee === "string" &&

    typeof v.firstPositionId === "string" &&

    typeof v.secondCommittee === "string" &&

    typeof v.secondPositionId === "string" &&

    typeof v.motivation === "string" &&

    (typeof v.slotId === "string" || v.slotId === undefined) &&

    typeof (v.portfolioUrl ?? "") === "string" &&

    typeof (v.githubUrl ?? "") === "string"

  )

}



export function loadApplyFormDraft(): ApplyFormDraft | null {

  if (typeof window === "undefined") return null

  try {

    const raw = sessionStorage.getItem(STORAGE_KEY)

    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<ApplyFormDraft>

    if (

      !isStep(parsed.step) ||

      !isGeneral(parsed.general) ||

      !isCommittee(parsed.committee)

    ) {

      return null

    }

    const privacy = isPrivacy(parsed.privacy)

      ? parsed.privacy

      : { dataPrivacyAgreed: false }

    return {

      step: parsed.step,

      privacy,

      general: {

        ...parsed.general,

        birthday: parsed.general.birthday ?? "",

        gender: parsed.general.gender ?? "",

        studentNumber: parsed.general.studentNumber ?? "",

        contactDigits: parsed.general.contactDigits ?? "",

        facebookUrl: parsed.general.facebookUrl ?? "",

      },

      committee: {

        ...parsed.committee,

        slotId: parsed.committee.slotId ?? "",

        portfolioUrl: parsed.committee.portfolioUrl ?? "",

        githubUrl: parsed.committee.githubUrl ?? "",

      },

      resumeName:

        typeof parsed.resumeName === "string" ? parsed.resumeName : undefined,

      transcriptName:

        typeof parsed.transcriptName === "string"

          ? parsed.transcriptName

          : undefined,

      registrationName:

        typeof parsed.registrationName === "string"

          ? parsed.registrationName

          : undefined,

    }

  } catch {

    return null

  }

}



export function saveApplyFormDraft(draft: ApplyFormDraft) {

  if (typeof window === "undefined") return

  try {

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))

  } catch {

    // private mode or quota — ignore

  }

}



export function clearApplyFormDraft() {

  if (typeof window === "undefined") return

  sessionStorage.removeItem(STORAGE_KEY)

}


