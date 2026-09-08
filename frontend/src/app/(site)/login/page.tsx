import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session-server"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const session = await getServerSession()
  if (session) redirect("/admin/hr")

  return <LoginForm />
}
