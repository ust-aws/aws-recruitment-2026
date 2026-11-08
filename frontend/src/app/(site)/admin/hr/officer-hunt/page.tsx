import { HrApplicationList } from "@/components/hr/applications/application-list"
import {
  firstSearchParam,
  hrListSearchFromPageSearchParams,
} from "@/lib/hr/filters-search-params"

export default async function HrOfficerHuntApplicationsPage({
  searchParams,
}: PageProps<"/admin/hr/officer-hunt">) {
  const params = await searchParams
  return (
    <HrApplicationList
      notice={firstSearchParam(params.notice)}
      listSearch={hrListSearchFromPageSearchParams(params)}
    />
  )
}
