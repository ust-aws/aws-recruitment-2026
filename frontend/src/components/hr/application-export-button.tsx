"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { applicationsToCsv } from "@/lib/hr-applications-csv"
import type { HrApplication } from "@/lib/hr-application-types"

const exportButtonClasses = "h-10 gap-2 px-5 font-mono text-xs"

type ApplicationExportButtonProps = {
  applications: HrApplication[]
  archive: "active" | "archived"
}

export function ApplicationExportButton({
  applications,
  archive,
}: ApplicationExportButtonProps) {
  function downloadCsv() {
    const blob = new Blob(["\ufeff", applicationsToCsv(applications)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `r101-applications-${archive}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      color="purple"
      className={exportButtonClasses}
      disabled={applications.length === 0}
      onClick={downloadCsv}
    >
      <Download />
      Export CSV ({applications.length})
    </Button>
  )
}
