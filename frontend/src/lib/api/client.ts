import type {
  Application,
  ApplicationType,
  CreateApplicationInput,
  DocumentType,
  Position,
} from "@/lib/types/application"
import type {
  HrApplication,
  UpdateApplicationDecisionInput,
} from "@/lib/types/hr-application"
import {
  readApiErrorMessage,
  userFacingApiError,
} from "@/lib/api/error-message"
import { trackQuery, withTrack, type RecruitmentTrack } from "@/lib/types/track"

const API_BASE = "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.replace("/login");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/logout"
    ) {
      redirectToLogin();
    }
    const serverMessage = await readApiErrorMessage(response);
    throw new ApiError(
      response.status,
      userFacingApiError(response.status, serverMessage),
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type ApplicationListParams = {
  /** Which round's applications; R101's when left out. */
  track?: RecruitmentTrack;
  query?: string;
  committeeName?: string;
  status?: "pending" | "approved" | "rejected" | "redirected";
  applicationType?: ApplicationType;
  archive?: "active" | "archived" | "all";
  page?: number;
  pageSize?: number;
};

export type ApplicationListResponse = {
  applications: HrApplication[];
  total: number;
};

export function listApplications(params: ApplicationListParams = {}) {
  const query = trackQuery(params.track);
  if (params.query) query.set("query", params.query);
  if (params.committeeName) query.set("committeeName", params.committeeName);
  if (params.status) query.set("status", params.status);
  if (params.applicationType) {
    query.set("applicationType", params.applicationType);
  }
  query.set("archive", params.archive ?? "active");
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  return apiFetch<ApplicationListResponse>(`/applications?${query}`);
}

export async function listAllApplications(params: ApplicationListParams = {}) {
  const pageSize = 100;
  const first = await listApplications({ ...params, page: 1, pageSize });
  const totalPages = Math.ceil(first.total / pageSize);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listApplications({ ...params, page: index + 2, pageSize }),
    ),
  );

  return [first, ...remainingPages].flatMap(
    (response) => response.applications,
  );
}

export function getApplicationById(id: string) {
  return apiFetch<HrApplication>(`/applications/${id}`);
}

export function postApplication(body: CreateApplicationInput, track?: RecruitmentTrack) {
  return apiFetch<Application>(track === "officer_hunt" ? "/officer-hunt/applications" : "/applications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postHrApplication(body: CreateApplicationInput) {
  return apiFetch<Application>("/applications/hr", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type UploadPresignRequest = {
  documents: {
    documentType: DocumentType
    fileName: string
    sizeBytes: number
    checksumSha256: string
  }[]
}

export type UploadPresignResponse = {
  uploadSessionId: string
  uploadExpiresAt: string
  sessionExpiresAt: string
  uploads: {
    documentType: DocumentType
    url: string
    fields: Record<string, string>
  }[]
}

export function postUploadPresign(body: UploadPresignRequest, track?: RecruitmentTrack) {
  return apiFetch<UploadPresignResponse>(withTrack("/uploads/presign", track), {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function postHrUploadPresign(body: UploadPresignRequest) {
  return apiFetch<UploadPresignResponse>("/uploads/hr/presign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchApplicationDecisionRequest(
  id: string,
  body: UpdateApplicationDecisionInput,
) {
  return apiFetch<HrApplication>(`/applications/${id}/decisions`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function patchApplicationArchivedRequest(id: string, archived: boolean) {
  return apiFetch<HrApplication>(`/applications/${id}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
  });
}

export function deleteArchivedApplicationRequest(id: string) {
  return apiFetch<void>(`/applications/${id}`, {
    method: "DELETE",
  });
}

export function patchApplicantEmailRequest(id: string, email: string) {
  return apiFetch<HrApplication>(`/applications/${id}/email`, {
    method: "PATCH",
    body: JSON.stringify({ email }),
  });
}

export function resendApplicationSubmittedEmailRequest(id: string) {
  return apiFetch<{ sent: boolean; recipient: string }>(
    `/applications/${id}/emails/resend-submitted`,
    { method: "POST" },
  );
}

export function patchApplicationRedirectPlacementRequest(
  id: string,
  redirectPositionId: string | null,
) {
  return apiFetch<HrApplication>(`/applications/${id}/redirect-placement`, {
    method: "PATCH",
    body: JSON.stringify({ redirectPositionId }),
  });
}


type PositionApiRow = {
  id: string;
  title: string;
  office: string;
  committee: string;
  committee_id: string;
  committeeDescription: string;
  description: string;
  responsibilities: string;
  isOpen: boolean;
  committeeAcceptingApplications?: boolean;
  openSlots: number;
};

export type CommitteeApplicationStatus = {
  id: string
  name: string
  acceptingApplications: boolean
}

export type BrowserPosition = {
  id: string;
  title: string;
  office: string;
  committee: string;
  committeeDescription: string;
  description: string;
  responsibilities: string[];
  isOpen: boolean;
  acceptingApplications: boolean;
  openSlots: number;
};

const openPositionsCaches: Partial<Record<RecruitmentTrack, Position[]>> = {};
const browserPositionsCaches: Partial<Record<RecruitmentTrack, BrowserPosition[]>> = {};
const positionsInflight: Partial<Record<RecruitmentTrack, Promise<void>>> = {};

function clearPositionCaches() {
  for (const track of ["r101", "officer_hunt"] as const) {
    delete openPositionsCaches[track];
    delete browserPositionsCaches[track];
  }
}

function mapOpenPosition(row: PositionApiRow): Position {
  return {
    id: row.id,
    committee: row.committee,
    office: row.office,
    committee_id: row.committee_id,
    acceptingApplications: row.committeeAcceptingApplications !== false,
    title: row.title,
    description: row.description ?? "",
  };
}

function mapBrowserPosition(row: PositionApiRow): BrowserPosition {
  return {
    id: row.id,
    title: row.title,
    office: row.office,
    committee: row.committee,
    committeeDescription: row.committeeDescription,
    description: row.description,
    responsibilities: row.responsibilities
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    isOpen: row.isOpen,
    acceptingApplications: row.committeeAcceptingApplications !== false,
    openSlots: row.openSlots,
  };
}

function ensurePositionsLoaded(track: RecruitmentTrack) {
  if (openPositionsCaches[track] && browserPositionsCaches[track]) {
    return Promise.resolve();
  }
  const inflight = positionsInflight[track];
  if (inflight) return inflight;
  const request = apiFetch<PositionApiRow[]>(withTrack("/positions", track))
    .then((rows) => {
      openPositionsCaches[track] = rows.map(mapOpenPosition);
      browserPositionsCaches[track] = rows.map(mapBrowserPosition);
    })
    .finally(() => {
      delete positionsInflight[track];
    });
  positionsInflight[track] = request;
  return request;
}

export function peekOpenPositions(track: RecruitmentTrack = "r101") {
  return typeof window === "undefined" ? null : (openPositionsCaches[track] ?? null);
}

export function listOpenPositions(track: RecruitmentTrack = "r101") {
  if (typeof window === "undefined") {
    return apiFetch<PositionApiRow[]>(withTrack("/positions", track)).then((rows) =>
      rows.map(mapOpenPosition)
    );
  }
  return ensurePositionsLoaded(track).then(() => openPositionsCaches[track] ?? []);
}

export function listAllPositions(track: RecruitmentTrack = "r101") {
  return apiFetch<PositionApiRow[]>(withTrack("/positions?scope=all", track)).then((rows) =>
    rows.map((row) => ({
      ...mapOpenPosition(row),
      isOpen: row.isOpen,
      openSlots: row.openSlots,
    })),
  );
}

export function listCommitteeApplicationStatuses() {
  return apiFetch<CommitteeApplicationStatus[]>("/positions/committees")
}

export function patchCommitteeApplicationStatus(
  id: string,
  acceptingApplications: boolean,
) {
  return apiFetch<CommitteeApplicationStatus>(
    `/positions/committees/${id}/application-status`,
    {
      method: "PATCH",
      body: JSON.stringify({ acceptingApplications }),
    },
  ).then((updated) => {
    clearPositionCaches()
    return updated
  })
}

export type PositionApprovalTarget = {
  id: string
  title: string
  committee: string
  openSlots: number
}

function mapPositionApprovalTarget(row: PositionApiRow): PositionApprovalTarget {
  return {
    id: row.id,
    title: row.title,
    committee: row.committee,
    openSlots: row.openSlots,
  }
}

export function listPositionApprovalTargets() {
  return apiFetch<PositionApiRow[]>("/positions?scope=all").then((rows) =>
    rows.map(mapPositionApprovalTarget),
  )
}

export function patchPositionApprovalTarget(id: string, openSlots: number) {
  return apiFetch<PositionApiRow>(`/positions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ open_slots: openSlots }),
  }).then((updated) => {
    clearPositionCaches()
    return mapPositionApprovalTarget(updated)
  })
}

export type PositionInterviewSlots = {
  committee: { id: string; name: string };
  slots: { id: string; startsAt: string; endsAt: string }[];
  booked: { startsAt: string; endsAt: string }[];
};

export function listPositionInterviewSlots(positionId: string) {
  return apiFetch<PositionInterviewSlots>(
    `/positions/${encodeURIComponent(positionId)}/interview-slots`,
  );
}

export type HrInterviewSlotBooking = {
  id: string;
  applicationId: string;
  applicationCode: string;
  applicantName: string;
};

export type HrInterviewSlot = {
  id: string;
  committeeId: string;
  committeeName: string;
  startsAt: string;
  endsAt: string;
  isOpen: boolean;
  isAvailable: boolean;
  booking: HrInterviewSlotBooking | null;
};

export function listInterviewSlots(params: {
  committeeId: string;
  from: string;
  to: string;
  track?: RecruitmentTrack;
}) {
  const query = trackQuery(params.track);
  query.set("committeeId", params.committeeId);
  query.set("from", params.from);
  query.set("to", params.to);
  return apiFetch<{ slots: HrInterviewSlot[] }>(
    `/interview-slots?${query.toString()}`,
  ).then((body) => body.slots);
}

export function createInterviewSlot(
  committeeId: string,
  startsAt: string,
  track?: RecruitmentTrack,
) {
  return apiFetch<HrInterviewSlot>(withTrack("/interview-slots", track), {
    method: "POST",
    body: JSON.stringify({ committeeId, startsAt }),
  });
}

export function patchInterviewSlotOpen(id: string, isOpen: boolean) {
  return apiFetch<HrInterviewSlot>(`/interview-slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isOpen }),
  });
}

export type ResetInterviewScheduleResult = {
  committeeId: string;
  committeeName: string;
  deletedSlots: number;
  deletedBookings: number;
};

export function resetInterviewSchedule(committeeId: string, track?: RecruitmentTrack) {
  const query = trackQuery(track);
  query.set("committeeId", committeeId);
  return apiFetch<ResetInterviewScheduleResult>(
    `/interview-slots?${query.toString()}`,
    { method: "DELETE" },
  );
}

export type RecruitmentSeasonCode =
  | "not_configured"
  | "recruitment_not_started"
  | "deadline_passed";

export type RecruitmentWindow = {
  startsAt: string | null;
  endsAt: string | null;
  open: boolean;
  code: RecruitmentSeasonCode | null;
  message: string | null;
};

export function getRecruitmentWindow() {
  return apiFetch<RecruitmentWindow>("/recruitment-window");
}

export function patchRecruitmentWindow(startsAt: string, endsAt: string) {
  return apiFetch<RecruitmentWindow>("/recruitment-window", {
    method: "PATCH",
    body: JSON.stringify({ startsAt, endsAt }),
  });
}

export type InterviewWindow = RecruitmentWindow;

export function getInterviewWindow() {
  return apiFetch<InterviewWindow>("/interview-window");
}

export function patchInterviewWindow(startsAt: string, endsAt: string) {
  return apiFetch<InterviewWindow>("/interview-window", {
    method: "PATCH",
    body: JSON.stringify({ startsAt, endsAt }),
  });
}

export type ResultClassification =
  | "accepted"
  | "rejected"
  | "incomplete"
  | "redirected";

export type ResultPreviewApplication = {
  id: string;
  applicationCode: string;
  applicationType: ApplicationType;
  applicant: { fullName: string; email: string };
  submittedAt: string;
  classification: ResultClassification;
  blockingReason: string | null;
  finalPlacement: {
    positionId: string;
    title: string;
    committeeId: string;
    committee: string;
  } | null;
  choices: {
    preferenceRank: 1 | 2;
    positionId: string;
    title: string;
    committeeId: string;
    committee: string;
    decisionStatus: "pending" | "approved" | "rejected";
  }[];
  willGenerateMemberId: boolean;
  willSendEmail: boolean;
};

export type ResultsPreview = {
  recruitmentYear: number;
  summary: {
    pendingRelease: number;
    accepted: number;
    rejected: number;
    redirected: number;
    incomplete: number;
    alreadyReleased: number;
    archived: number;
    canRelease: boolean;
  };
  applications: ResultPreviewApplication[];
};

export type ReleaseResultsResponse = {
  released: number;
  accepted: number;
  rejected: number;
  memberIdsGenerated: number;
  releasedAt: string | null;
  /** Emails are queued and sent in the background; see getResultEmailStatus. */
  emailDelivery: { queued: number };
  /** Officer hunt only: how many winners were seated as officers. */
  seated?: number;
};

export type ResultEmailStatus = {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  /** Failed rows that may already have reached the applicant. */
  uncertain: number;
  problems: { id: string; recipient: string; error: string | null; uncertain: boolean }[];
};

export function getResultsPreview(track?: RecruitmentTrack) {
  return apiFetch<ResultsPreview>(withTrack("/results/preview", track));
}

export function releaseResultsRequest(track?: RecruitmentTrack) {
  return apiFetch<ReleaseResultsResponse>(withTrack("/results/release", track), {
    method: "POST",
  });
}

export function retryFailedResultEmailsRequest(track?: RecruitmentTrack) {
  return apiFetch<{ retried: number }>(withTrack("/results/emails/retry-failed", track), {
    method: "POST",
  });
}

/** Resends just these uncertain emails, which HR found missing from the Sent folder. */
export function resendResultEmailsRequest(ids: string[], track?: RecruitmentTrack) {
  return apiFetch<{ retried: number }>(withTrack("/results/emails/resend-selected", track), {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

/** Counts these uncertain emails as sent, because HR found them in the Sent folder. */
export function markResultEmailsDeliveredRequest(ids: string[], track?: RecruitmentTrack) {
  return apiFetch<{ marked: number }>(withTrack("/results/emails/mark-delivered", track), {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export function getResultEmailStatus(track?: RecruitmentTrack) {
  return apiFetch<ResultEmailStatus>(withTrack("/results/emails/status", track));
}

export async function getSession(): Promise<{
  email: string;
  role: "hr" | "admin";
}> {
  return apiFetch("/auth/me");
}

