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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
  query?: string;
  committeeName?: string;
  status?: "pending" | "approved" | "rejected";
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
  const query = new URLSearchParams();
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

export function postApplication(body: CreateApplicationInput) {
  return apiFetch<Application>("/applications", {
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

export function postUploadPresign(body: UploadPresignRequest) {
  return apiFetch<UploadPresignResponse>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify(body),
  })
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
  openSlots: number;
};

export type BrowserPosition = {
  id: string;
  title: string;
  office: string;
  committee: string;
  committeeDescription: string;
  description: string;
  responsibilities: string[];
  isOpen: boolean;
  openSlots: number;
};

let openPositionsCache: Position[] | null = null;
let browserPositionsCache: BrowserPosition[] | null = null;
let positionsInflight: Promise<void> | null = null;

function mapOpenPosition(row: PositionApiRow): Position {
  return {
    id: row.id,
    committee: row.committee,
    committee_id: row.committee_id,
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
    openSlots: row.openSlots,
  };
}

function ensurePositionsLoaded() {
  if (openPositionsCache && browserPositionsCache) {
    return Promise.resolve();
  }
  if (positionsInflight) return positionsInflight;
  positionsInflight = apiFetch<PositionApiRow[]>("/positions")
    .then((rows) => {
      openPositionsCache = rows.map(mapOpenPosition);
      browserPositionsCache = rows.map(mapBrowserPosition);
    })
    .finally(() => {
      positionsInflight = null;
    });
  return positionsInflight;
}

export function peekOpenPositions() {
  return typeof window === "undefined" ? null : openPositionsCache;
}

export function peekBrowserPositions() {
  return typeof window === "undefined" ? null : browserPositionsCache;
}

export function listOpenPositions() {
  if (typeof window === "undefined") {
    return apiFetch<PositionApiRow[]>("/positions").then((rows) => rows.map(mapOpenPosition));
  }
  return ensurePositionsLoaded().then(() => openPositionsCache ?? []);
}

export function listBrowserPositions() {
  if (typeof window === "undefined") {
    return apiFetch<PositionApiRow[]>("/positions").then((rows) => rows.map(mapBrowserPosition));
  }
  return ensurePositionsLoaded().then(() => browserPositionsCache ?? []);
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
}) {
  const query = new URLSearchParams({
    committeeId: params.committeeId,
    from: params.from,
    to: params.to,
  });
  return apiFetch<{ slots: HrInterviewSlot[] }>(
    `/interview-slots?${query.toString()}`,
  ).then((body) => body.slots);
}

export function createInterviewSlot(committeeId: string, startsAt: string) {
  return apiFetch<HrInterviewSlot>("/interview-slots", {
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

export function resetInterviewSchedule(committeeId: string) {
  const query = new URLSearchParams({ committeeId });
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

export type ResultClassification = "accepted" | "rejected" | "incomplete";

export type ResultPreviewApplication = {
  id: string;
  applicationCode: string;
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
  emailDelivery: { queued: number; sent: number; failed: number };
};

export function getResultsPreview() {
  return apiFetch<ResultsPreview>("/results/preview");
}

export function releaseResultsRequest() {
  return apiFetch<ReleaseResultsResponse>("/results/release", {
    method: "POST",
  });
}

export function retryFailedResultEmailsRequest() {
  return apiFetch<{ retried: number; sent: number; failed: number }>(
    "/results/emails/retry-failed",
    { method: "POST" },
  );
}

type LoginResponse = {
  email: string;
  expiresAt: string;
};

export async function getSession(): Promise<{ email: string }> {
  return apiFetch<{ email: string }>("/auth/me");
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    return await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiError(0, "Could not reach the API");
    }
    if (err instanceof ApiError && err.status === 401) {
      throw new ApiError(401, "Invalid credentials");
    }
    throw err;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", {
      method: "POST",
    });
  } catch {
    // Client still navigates away even if the request fails.
  }
}
