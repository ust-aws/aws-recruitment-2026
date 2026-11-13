import { redirect } from "next/navigation"
import { HrShell } from "@/components/hr/shell/hr-shell"
import { getServerSession } from "@/lib/auth/session-server"

export default async function AdminHrLayout({
  children,
}: LayoutProps<"/admin/hr">) {
  const session = await getServerSession()
  if (!session) redirect("/login")

  return <HrShell role={session.role}>{children}</HrShell>
}
