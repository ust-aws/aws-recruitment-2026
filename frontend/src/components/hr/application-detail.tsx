"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { HrApplicationDetailContent } from "@/components/hr/hr-application-detail-content"
import { HrApplicationDetailSkeleton } from "@/components/hr/application-detail-skeleton"
import { useApplication } from "@/lib/api"
import { pageShellClasses } from "@/lib/site/surface"

const backClasses =
  "mb-3 mt-3 inline-flex font-mono text-xs text-prelude hover:text-blue-chalk"
const missingClasses = "font-sans text-sm text-prelude"

function listHrefFromSearchParams(searchParams: URLSearchParams) {
  const returnTo = searchParams.get("returnTo")
  if (!returnTo) return undefined
  const pathname = returnTo.split("?", 1)[0]
  return pathname === "/admin/hr" || pathname === "/admin/hr/archive"
    ? returnTo
    : undefined
}

function HrApplicationDetailFallback({
  listHref,
  message,
}: {
  listHref: string
  message: string
}) {
  return (
    <main className={pageShellClasses}>
      <Link href={listHref} className={backClasses}>
        ← Back to Applications
      </Link>
      <p className={missingClasses}>{message}</p>
    </main>
  )
}

export function HrApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const returnTo = listHrefFromSearchParams(searchParams)
  const { application, setApplication, loading, error } = useApplication(id)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (loading) return <HrApplicationDetailSkeleton />

  if (!application) {
    return (
      <HrApplicationDetailFallback
        listHref={returnTo ?? "/admin/hr"}
        message={error ?? "That application was not found."}
      />
    )
  }

  const fromArchive = searchParams.get("source") === "archive"
  const viewingArchive = returnTo
    ? returnTo.startsWith("/admin/hr/archive")
    : Boolean(application.archivedAt) || fromArchive

  return (
    <HrApplicationDetailContent
      application={application}
      listHref={returnTo ?? (viewingArchive ? "/admin/hr/archive" : "/admin/hr")}
      viewingArchive={viewingArchive}
      archiveOpen={archiveOpen}
      deleteOpen={deleteOpen}
      onArchiveOpenChange={setArchiveOpen}
      onDeleteOpenChange={setDeleteOpen}
      onUpdated={setApplication}
    />
  )
}
