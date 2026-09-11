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
  readApiErrorMessage,
  userFacingApiError,
} from "./api-error-message"

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

export function listApplications() {
  return apiFetch<{ applications: HrApplication[]; total: number }>(
    "/applications",
  ).then((body) => body.applications);
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

export function patchApplicationDecisionRequest(
  id: string,
  body: UpdateApplicationDecisionInput,
) {
  return apiFetch<HrApplication>(`/applications/${id}/decisions`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteApplicationRequest(id: string) {
  return apiFetch<void>(`/applications/${id}`, { method: "DELETE" });
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
  return openPositionsCache;
}

export function peekBrowserPositions() {
  return browserPositionsCache;
}

export function listOpenPositions() {
  return ensurePositionsLoaded().then(() => openPositionsCache ?? []);
}

export function listBrowserPositions() {
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

export type RecruitmentWindow = {
  startsAt: string | null;
  endsAt: string | null;
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
