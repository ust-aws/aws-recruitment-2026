import Link from "next/link"
import {
  ApplicationFilters,
  type HrFilters,
} from "@/components/hr/applications/application-filters"
import { ApplicationExportButton } from "@/components/hr/applications/application-export-button"
import { Button } from "@/components/ui/button"
import { useRecruitmentTrack } from "@/lib/recruitment-track"

const toolbarClasses = "mt-6"
const addButtonClasses = "h-12 gap-2 px-5 font-mono text-xs"

export function HrApplicationListToolbar({
  variant,
  filters,
  total,
  onFiltersChange,
  onExportError,
}: {
  variant: "active" | "archived"
  filters: HrFilters
  total: number
  onFiltersChange: (patch: Partial<HrFilters>) => void
  onExportError: (message: string) => void
}) {
  const track = useRecruitmentTrack()
  return (
    <div className={toolbarClasses}>
      <ApplicationFilters
        value={filters}
        onChange={onFiltersChange}
        actions={
          <>
            {/* HR intake adds R101 applicants; hunt applicants apply on the public page. */}
            {variant === "active" && track === "r101" ? (
              <Button
                color="cyan"
                className={addButtonClasses}
                nativeButton={false}
                render={<Link href="/admin/hr/add" />}
              >
                Add Applicant
              </Button>
            ) : null}
            <ApplicationExportButton
              filters={{
                track,
                query: filters.query.trim(),
                committeeName: filters.committee || undefined,
                status: filters.status || undefined,
                applicationType: filters.applicationType || undefined,
                archive: variant,
              }}
              total={total}
              onError={onExportError}
            />
          </>
        }
      />
    </div>
  )
}
