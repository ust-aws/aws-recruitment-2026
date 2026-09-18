"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  listAllApplications,
  type ApplicationListParams,
} from "@/lib/api/client"
import { applicationsToCsv } from "@/lib/hr/applications-csv"

const exportButtonClasses = "h-10 gap-2 px-5 font-mono text-xs"

type ApplicationExportButtonProps = {
  filters: ApplicationListParams
  total: number
  onError: (message: string) => void
}

export function ApplicationExportButton({
  filters,
  total,
  onError,
}: ApplicationExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  async function downloadCsv() {
    setExporting(true)
    try {
      const applications = await listAllApplications(filters)
      const blob = new Blob(["\ufeff", applicationsToCsv(applications)], {
        type: "text/csv;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `r101-applications-${filters.archive ?? "active"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to export applications."
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      color="purple"
      className={exportButtonClasses}
      disabled={exporting || total === 0}
      onClick={downloadCsv}
    >
      <Download />
      {exporting ? "Exporting..." : `Export CSV (${total})`}
    </Button>
  )
}
