import type { GeneralInfoValues } from "@/components/apply/general-info-step"
import type { CommitteeValues } from "@/components/apply/committee-step"

const STORAGE_KEY = "aws-ust-apply-draft"

export type ApplyFormDraft = {
  step: 1 | 2 | 3
  general: GeneralInfoValues
  committee: CommitteeValues
  resumeName?: string
  transcriptName?: string
}

function isStep(value: unknown): value is ApplyFormDraft["step"] {
  return value === 1 || value === 2 || value === 3
}

function isGeneral(values: unknown): values is GeneralInfoValues {
  if (!values || typeof values !== "object") return false
  const v = values as Record<string, unknown>
  return (
    typeof v.firstName === "string" &&
    typeof v.lastName === "string" &&
    typeof v.age === "string" &&
    typeof v.section === "string" &&
    typeof v.emailLocal === "string"
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
    typeof v.motivation === "string"
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
    return {
      step: parsed.step,
      general: parsed.general,
      committee: parsed.committee,
      resumeName:
        typeof parsed.resumeName === "string" ? parsed.resumeName : undefined,
      transcriptName:
        typeof parsed.transcriptName === "string"
          ? parsed.transcriptName
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
