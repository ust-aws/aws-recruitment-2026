import type { HrFilters } from "@/components/hr/application-filters"
import type {
  ApplicationStatus,
  ApplicationType,
} from "@/lib/types/application"

const STATUSES: ApplicationStatus[] = ["pending", "approved", "rejected"]
const APPLICATION_TYPES: ApplicationType[] = ["position", "member"]

export type HrListSearchParamsInput = {
  q?: string
  committee?: string
  status?: string
  type?: string
  page?: string
}

export const emptyHrFilters: HrFilters = {
  query: "",
  committee: "",
  status: "",
  applicationType: "",
}

function parseStatus(value: string | undefined): HrFilters["status"] {
  if (!value) return ""
  return STATUSES.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : ""
}

function parseApplicationType(
  value: string | undefined,
): HrFilters["applicationType"] {
  if (!value) return ""
  return APPLICATION_TYPES.includes(value as ApplicationType)
    ? (value as ApplicationType)
    : ""
}

export function hrFiltersFromListSearch(
  input: HrListSearchParamsInput | undefined,
): HrFilters {
  if (!input) return emptyHrFilters
  const filters: HrFilters = {
    query: input.q ?? "",
    committee: input.committee ?? "",
    status: parseStatus(input.status),
    applicationType: parseApplicationType(input.type),
  }
  return filters.applicationType === "member"
    ? { ...filters, committee: "" }
    : filters
}

export function hrPageFromListSearch(
  input: HrListSearchParamsInput | undefined,
): number {
  const raw = input?.page
  if (!raw) return 1
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function mergeHrFilters(
  current: HrFilters,
  patch: Partial<HrFilters>,
): HrFilters {
  const next = { ...current, ...patch }
  return next.applicationType === "member"
    ? { ...next, committee: "" }
    : next
}

export function buildHrListQueryString(
  filters: HrFilters,
  page: number,
  options?: { notice?: string },
): string {
  const params = new URLSearchParams()
  if (options?.notice) params.set("notice", options.notice)
  const query = filters.query.trim()
  if (query) params.set("q", query)
  if (filters.committee) params.set("committee", filters.committee)
  if (filters.status) params.set("status", filters.status)
  if (filters.applicationType) params.set("type", filters.applicationType)
  if (page > 1) params.set("page", String(page))
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value[0] : value
}

export function hrListSearchFromPageSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): HrListSearchParamsInput {
  return {
    q: firstSearchParam(searchParams.q),
    committee: firstSearchParam(searchParams.committee),
    status: firstSearchParam(searchParams.status),
    type: firstSearchParam(searchParams.type),
    page: firstSearchParam(searchParams.page),
  }
}
