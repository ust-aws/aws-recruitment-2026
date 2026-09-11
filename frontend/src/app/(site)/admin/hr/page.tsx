import { HrApplicationList } from "@/components/hr/application-list"

export default async function HrApplicationsPage({
  searchParams,
}: PageProps<"/admin/hr">) {
  const { notice } = await searchParams
  return (
    <HrApplicationList
      notice={typeof notice === "string" ? notice : undefined}
    />
  )
}