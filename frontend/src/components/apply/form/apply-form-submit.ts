import type { MutableRefObject } from "react"
import type { ApplyFormValues } from "@/components/apply/form/apply-schema"
import { clearApplyFormDraft } from "@/components/apply/form/apply-form-draft"
import { toCreateApplicationInput } from "@/components/apply/form/form-model"
import {
  createApplication,
  createHrApplication,
  createHrUploadSession,
  createUploadSession,
} from "@/lib/api"
import {
  documentUploadMetadata,
  uploadDocumentFiles,
} from "@/lib/apply/document-upload"
import type { RecruitmentTrack } from "@/lib/types/track"

type CompletedUploadSession = { fingerprint: string; id: string; expiresAt: string }

export type ApplyFormSubmitSuccess = {
  applicationCode: string
  applicationType: "position" | "member"
  successChoices: {
    firstCommittee: string
    secondCommittee: string
    firstTitle: string
    secondTitle: string
  }
}

export async function submitApplyForm(
  values: ApplyFormValues,
  ustEmailDomain: string,
  completedUploadRef: MutableRefObject<CompletedUploadSession | null>,
  hrMode = false,
  track: RecruitmentTrack = "r101",
): Promise<ApplyFormSubmitSuccess> {
  const files = [
    { documentType: "resume" as const, file: values.upload.resume! },
    { documentType: "registration" as const, file: values.upload.registration! },
  ]
  const documents = await documentUploadMetadata(files)
  const fingerprint = JSON.stringify(documents)
  const cachedUpload = completedUploadRef.current
  let uploadSessionId = cachedUpload?.id
  if (
    !cachedUpload ||
    cachedUpload.fingerprint !== fingerprint ||
    new Date(cachedUpload.expiresAt) <= new Date()
  ) {
    const createSession = hrMode ? createHrUploadSession : createUploadSession
    const session = await createSession({ documents }, track)
    await uploadDocumentFiles(files, session)
    uploadSessionId = session.uploadSessionId
    completedUploadRef.current = {
      fingerprint,
      id: session.uploadSessionId,
      expiresAt: session.sessionExpiresAt,
    }
  }
  const input = toCreateApplicationInput(
    values.privacy,
    values.general,
    values.committee,
    values.upload,
    ustEmailDomain,
    uploadSessionId!,
    hrMode,
  )
  const created = hrMode ? await createHrApplication(input) : await createApplication(input, track)
  // The saved draft belongs to R101's form; the hunt does not keep one.
  if (!hrMode && track === "r101") clearApplyFormDraft()
  const createdFirst = created.choices.find((choice) => choice.preferenceRank === 1)
  const createdSecond = created.choices.find((choice) => choice.preferenceRank === 2)
  return {
    applicationCode: created.applicationCode,
    applicationType: created.applicationType,
    successChoices: {
      firstCommittee: createdFirst?.committee ?? values.committee.firstCommittee,
      secondCommittee: createdSecond?.committee ?? values.committee.secondCommittee,
      firstTitle: createdFirst?.title ?? values.committee.firstPositionTitle,
      secondTitle: createdSecond?.title ?? values.committee.secondPositionTitle,
    },
  }
}
