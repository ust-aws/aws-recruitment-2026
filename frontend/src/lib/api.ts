import { useEffect, useState } from "react"
import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  DocumentType,
  Position,
} from "./application-types"
import {
  ApiError,
  deleteApplicationRequest,
  getApplicationById,
  listApplications,
  listOpenPositions,
  peekOpenPositions,
  patchApplicationStatusRequest,
  postApplication,
} from "./api-client"

export {
  ApiError,
  getSession,
  login,
  logout,
  listOpenPositions,
  listBrowserPositions,
  listPositionInterviewSlots,
  peekOpenPositions,
  peekBrowserPositions,
  getRecruitmentWindow,
  patchRecruitmentWindow,
  getInterviewWindow,
  patchInterviewWindow,
  listInterviewSlots,
  createInterviewSlot,
  patchInterviewSlotOpen,
  resetInterviewSchedule,
} from "./api-client"
export type {
  RecruitmentWindow,
  InterviewWindow,
  HrInterviewSlot,
  HrInterviewSlotBooking,
} from "./api-client"

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listApplications()
      .then((rows) => {
        if (cancelled) return
        setApplications(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setApplications([])
        setError(err instanceof Error ? err.message : "Failed to load applications.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function removeApplication(id: string) {
    setApplications((current) => current.filter((app) => app.id !== id))
  }

  return { applications, loading, error, removeApplication }
}

export function useApplication(id: string | undefined) {
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    getApplicationById(id)
      .then((row) => {
        if (cancelled) return
        setApplication(row)
        setError(null)
        setNotFound(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setApplication(null)
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
          setError(null)
          return
        }
        setNotFound(false)
        setError(err instanceof Error ? err.message : "Failed to load application.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!id) {
    return {
      application: null,
      setApplication,
      loading: false,
      error: null,
      notFound: true,
    }
  }

  return { application, setApplication, loading, error, notFound }
}

export function useOpenPositions() {
  const cached = peekOpenPositions()
  const [positions, setPositions] = useState<Position[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listOpenPositions()
      .then((rows) => {
        if (cancelled) return
        setPositions(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setPositions([])
        setError(err instanceof Error ? err.message : "Failed to load positions.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const committees = [...new Set(positions.map((position) => position.committee))]
  return { positions, committees, loading, error }
}

export async function createApplication(
  input: Omit<CreateApplicationInput, "documents"> & {
    slotId: string
    documents: { documentType: DocumentType; fileName: string }[]
  }
): Promise<Application> {
  const payload: CreateApplicationInput = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    age: input.age,
    birthday: input.birthday,
    gender: input.gender,
    section: input.section,
    studentNumber: input.studentNumber,
    contactNumber: input.contactNumber,
    facebookUrl: input.facebookUrl,
    dataPrivacyAgreed: input.dataPrivacyAgreed,
    motivation: input.motivation,
    portfolioUrl: input.portfolioUrl,
    githubUrl: input.githubUrl,
    slotId: input.slotId,
    choices: input.choices,
    documents: input.documents.map((doc) => ({
      documentType: doc.documentType,
      fileName: doc.fileName,
      // Presign isn't in yet (#10); this string only exists so POST validation passes.
      s3Key: `dev/uploads/${crypto.randomUUID()}/${doc.fileName}`,
    })),
  }
  return postApplication(payload)
}

export function patchApplicationStatus(id: string, status: ApplicationStatus) {
  return patchApplicationStatusRequest(id, status)
}

export function deleteApplication(id: string) {
  return deleteApplicationRequest(id)
}

export function fullName(app: Application) {
  return `${app.firstName} ${app.lastName}`
}

export function firstChoiceCommittee(app: Application) {
  return (
    app.choices.find((choice) => choice.preferenceRank === 1)?.committee ?? "—"
  )
}

export function hasCommittee(app: Application, committee: string) {
  return app.choices.some((choice) => choice.committee === committee)
}

export function formatAppliedDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-")
  return `${Number(month)}/${Number(day)}/${year}`
}
