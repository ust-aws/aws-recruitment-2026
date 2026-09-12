import { useCallback, useEffect, useState } from "react"
import type {
  Application,
  CreateApplicationInput,
  Position,
} from "./application-types"
import type {
  HrApplication,
  UpdateApplicationDecisionInput,
} from "./hr-application-types"
import {
  ApiError,
  getApplicationById,
  listApplications,
  listOpenPositions,
  peekOpenPositions,
  patchApplicationArchivedRequest,
  patchApplicationDecisionRequest,
  postApplication,
  postUploadPresign,
  type ApplicationListParams,
  type UploadPresignRequest,
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

export function useApplications(params: ApplicationListParams) {
  const {
    query = "",
    committeeName = "",
    status,
    archive = "active",
    page = 1,
    pageSize = 10,
  } = params
  const [applications, setApplications] = useState<HrApplication[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(
      () => {
        setLoading(true)
        listApplications({
          query,
          committeeName,
          status,
          archive,
          page,
          pageSize,
        })
          .then((response) => {
            if (cancelled) return
            setApplications(response.applications)
            setTotal(response.total)
            setError(null)
          })
          .catch((err: unknown) => {
            if (cancelled) return
            setApplications([])
            setTotal(0)
            setError(
              err instanceof Error ? err.message : "Failed to load applications."
            )
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })
      },
      query ? 250 : 0
    )

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [archive, committeeName, page, pageSize, query, reloadVersion, status])

  const refreshApplications = useCallback(() => {
    setReloadVersion((current) => current + 1)
  }, [])

  return { applications, total, loading, error, refreshApplications }
}

export function useApplication(id: string | undefined) {
  const [application, setApplication] = useState<HrApplication | null>(null)
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
  input: CreateApplicationInput
): Promise<Application> {
  return postApplication(input)
}

export async function createUploadSession(input: UploadPresignRequest) {
  return postUploadPresign(input)
}

export function patchApplicationDecision(
  id: string,
  input: UpdateApplicationDecisionInput
) {
  return patchApplicationDecisionRequest(id, input)
}

export function setApplicationArchived(id: string, archived: boolean) {
  return patchApplicationArchivedRequest(id, archived)
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
