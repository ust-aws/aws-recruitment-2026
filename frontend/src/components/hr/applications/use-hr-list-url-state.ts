"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import type { HrFilters } from "@/components/hr/applications/application-filters"
import {
  buildHrListQueryString,
  hrFiltersFromListSearch,
  hrPageFromListSearch,
  mergeHrFilters,
  type HrListSearchParamsInput,
} from "@/lib/hr/filters-search-params"

const QUERY_URL_DEBOUNCE_MS = 400

export function useHrListUrlState(
  listSearch: HrListSearchParamsInput | undefined,
  notice: string | undefined,
) {
  const pathname = usePathname()
  const [filters, setFilters] = useState(() =>
    hrFiltersFromListSearch(listSearch),
  )
  const [page, setPage] = useState(() => hrPageFromListSearch(listSearch))
  const urlSyncTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (urlSyncTimeoutRef.current !== null) {
        window.clearTimeout(urlSyncTimeoutRef.current)
      }
    }
  }, [])

  function replaceListUrl(nextFilters: HrFilters, nextPage: number) {
    const query = buildHrListQueryString(nextFilters, nextPage, { notice })
    window.history.replaceState(null, "", `${pathname}${query}`)
  }

  function clearPendingSync() {
    if (urlSyncTimeoutRef.current !== null) {
      window.clearTimeout(urlSyncTimeoutRef.current)
      urlSyncTimeoutRef.current = null
    }
  }

  function scheduleListUrlSync(
    nextFilters: HrFilters,
    nextPage: number,
    debounceMs: number,
  ) {
    clearPendingSync()
    urlSyncTimeoutRef.current = window.setTimeout(() => {
      replaceListUrl(nextFilters, nextPage)
      urlSyncTimeoutRef.current = null
    }, debounceMs)
  }

  function onFiltersChange(patch: Partial<HrFilters>) {
    const next = mergeHrFilters(filters, patch)
    setFilters(next)
    setPage(1)
    scheduleListUrlSync(next, 1, "query" in patch ? QUERY_URL_DEBOUNCE_MS : 0)
  }

  function onPageChange(nextPage: number) {
    setPage(nextPage)
    replaceListUrl(filters, nextPage)
  }

  function onDetailNavigate() {
    clearPendingSync()
    replaceListUrl(filters, page)
  }

  function resetToFirstPage() {
    setPage(1)
    replaceListUrl(filters, 1)
  }

  const listHref = `${pathname}${buildHrListQueryString(filters, page, {
    notice,
  })}`

  return {
    filters,
    page,
    listHref,
    onFiltersChange,
    onPageChange,
    onDetailNavigate,
    resetToFirstPage,
  }
}
