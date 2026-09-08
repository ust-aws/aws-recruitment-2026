import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session-server"

export default async function AdminHrLayout({
  children,
}: LayoutProps<"/admin/hr">) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  return children
}
