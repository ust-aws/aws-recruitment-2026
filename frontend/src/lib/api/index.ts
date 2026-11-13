import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  Application,
  CreateApplicationInput,
  Position,
} from "@/lib/types/application"
import type {
  HrApplication,
  UpdateApplicationDecisionInput,
} from "@/lib/types/hr-application"
import { useRecruitmentTrack } from "@/lib/recruitment-track"
import type { RecruitmentTrack } from "@/lib/types/track"
import {
  ApiError,
  getApplicationById,
  listApplications,
  listAllPositions,
  listOpenPositions,
  peekOpenPositions,
  patchApplicationArchivedRequest,
  deleteArchivedApplicationRequest,
  patchApplicationDecisionRequest,
  patchApplicantEmailRequest,
  resendApplicationSubmittedEmailRequest,
  patchApplicationRedirectPlacementRequest,
  postApplication,
  postHrApplication,
  postHrUploadPresign,
  postUploadPresign,
  type ApplicationListParams,
  type UploadPresignRequest,
} from "@/lib/api/client"

const applicationPromises = new Map<string, Promise<HrApplication>>()

function loadApplication(id: string) {
  const existing = applicationPromises.get(id)
  if (existing) return existing
  const request = getApplicationById(id)
  applicationPromises.set(id, request)
  void request.then(
    () => applicationPromises.delete(id),
    () => applicationPromises.delete(id)
  )
  return request
}

export {
  ApiError,
  getSession,
  listOpenPositions,
  listPositionInterviewSlots,
  listCommitteeApplicationStatuses,
  patchCommitteeApplicationStatus,
  listPositionApprovalTargets,
  patchPositionApprovalTarget,
  peekOpenPositions,
  getRecruitmentWindow,
  patchRecruitmentWindow,
  getInterviewWindow,
  patchInterviewWindow,
  listInterviewSlots,
  createInterviewSlot,
  patchInterviewSlotOpen,
  resetInterviewSchedule,
} from "@/lib/api/client"
export type {
  RecruitmentWindow,
  InterviewWindow,
  HrInterviewSlot,
  HrInterviewSlotBooking,
  CommitteeApplicationStatus,
  PositionApprovalTarget,
} from "@/lib/api/client"

export function useApplications(params: ApplicationListParams) {
  const {
    query = "",
    committeeName = "",
    status,
    applicationType,
    archive = "active",
    page = 1,
    pageSize = 10,
  } = params
  const track = useRecruitmentTrack()
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
          track,
          query,
          committeeName,
          status,
          applicationType,
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
  }, [applicationType, archive, committeeName, page, pageSize, query, reloadVersion, status, track])

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
    loadApplication(id)
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

export function useOpenPositions(includeClosed = false) {
  const track = useRecruitmentTrack()
  const [positions, setPositions] = useState<Position[]>(
    () => (includeClosed ? null : peekOpenPositions(track)) ?? [],
  )
  const [loading, setLoading] = useState(
    () => includeClosed || !peekOpenPositions(track),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (includeClosed) {
      let cancelled = false
      listAllPositions(track)
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
    }

    let cancelled = false
    listOpenPositions(track)
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
  }, [includeClosed, track])

  const committees = useMemo(
    () => [...new Set(positions.map((position) => position.committee))],
    [positions]
  )
  return { positions, committees, loading, error }
}

export async function createApplication(
  input: CreateApplicationInput,
  track?: RecruitmentTrack,
): Promise<Application> {
  return postApplication(input, track)
}

export async function createHrApplication(
  input: CreateApplicationInput
): Promise<Application> {
  return postHrApplication(input)
}

export async function createUploadSession(input: UploadPresignRequest, track?: RecruitmentTrack) {
  return postUploadPresign(input, track)
}

export async function createHrUploadSession(input: UploadPresignRequest) {
  return postHrUploadPresign(input)
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

export function deleteArchivedApplication(id: string) {
  return deleteArchivedApplicationRequest(id)
}

export function patchApplicantEmail(id: string, email: string) {
  return patchApplicantEmailRequest(id, email)
}

export function resendApplicationSubmittedEmail(id: string) {
  return resendApplicationSubmittedEmailRequest(id)
}

export function patchApplicationRedirectPlacement(
  id: string,
  redirectPositionId: string | null,
) {
  return patchApplicationRedirectPlacementRequest(id, redirectPositionId)
}


export function fullName(app: Application) {
  return `${app.firstName} ${app.lastName}`
}

export function formatAppliedDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-")
  return `${Number(month)}/${Number(day)}/${year}`
}
