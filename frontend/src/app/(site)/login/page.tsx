import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session-server"
import { LoginForm } from "./login-form"

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams
  if (params.email || params.password) {
    redirect("/login")
  }

  const session = await getServerSession()
  if (session) redirect("/admin/hr")

  return <LoginForm />
}
