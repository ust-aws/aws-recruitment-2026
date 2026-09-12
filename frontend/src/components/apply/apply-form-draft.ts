import {
  applyFormDraftSchema,
  type ApplyFormDraft,
} from "@/components/apply/apply-schema"

const STORAGE_KEY = "aws-ust-apply-draft"

export type { ApplyFormDraft }

export function loadApplyFormDraft(): ApplyFormDraft | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const result = applyFormDraftSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
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
