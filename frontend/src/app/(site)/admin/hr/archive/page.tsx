import { HrApplicationList } from "@/components/hr/application-list"
import {
  firstSearchParam,
  hrListSearchFromPageSearchParams,
} from "@/lib/hr/filters-search-params"

export default async function HrArchivePage({
  searchParams,
}: PageProps<"/admin/hr/archive">) {
  const params = await searchParams
  const notice = firstSearchParam(params.notice)
  return (
    <HrApplicationList
      variant="archived"
      notice={notice}
      listSearch={hrListSearchFromPageSearchParams(params)}
    />
  )
}
