import { HrApplicationList } from "@/components/hr/application-list"
import {
  firstSearchParam,
  hrListSearchFromPageSearchParams,
} from "@/lib/hr/filters-search-params"

export default async function HrApplicationsPage({
  searchParams,
}: PageProps<"/admin/hr">) {
  const params = await searchParams
  const notice = firstSearchParam(params.notice)
  return (
    <HrApplicationList
      notice={notice}
      listSearch={hrListSearchFromPageSearchParams(params)}
    />
  )
}
