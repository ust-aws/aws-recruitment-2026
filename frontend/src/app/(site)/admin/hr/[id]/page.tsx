import { Suspense } from "react"
import { HrApplicationDetail } from "@/components/hr/applications/detail/application-detail"
import { HrApplicationDetailSkeleton } from "@/components/hr/applications/detail/application-detail-skeleton"

export default function HrApplicationDetailPage() {
  return (
    <Suspense fallback={<HrApplicationDetailSkeleton />}>
      <HrApplicationDetail />
    </Suspense>
  )
}
