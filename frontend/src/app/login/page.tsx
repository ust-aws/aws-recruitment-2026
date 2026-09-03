"use client"

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, login } from "@/lib/api"
import { getSession } from "@/lib/api-client"
import { getToken, setToken } from "@/lib/auth"

const pageClasses =
  "flex flex-1 flex-col items-center justify-center px-4 py-16"
const cardClasses =
  "glass w-full max-w-md rounded-[20px] border border-blue-chalk/20 bg-meteorite/55 p-8"
const eyebrowClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const titleClasses = "font-sans text-2xl font-bold text-blue-chalk"
const fieldClasses = "flex flex-col gap-2"
const errorClasses = "font-sans text-sm text-destructive"
const submitClasses = "mt-2 w-full"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!getToken()) return

    let cancelled = false
    getSession()
      .then(() => {
        if (!cancelled) router.replace("/admin/hr")
      })
      .catch(() => {
        // Fake or expired token: stay on login.
      })

    return () => {
      cancelled = true
    }
  }, [router])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const result = await login(email, password)
      setToken(result.token)
      router.push("/admin/hr")
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not sign in"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <main className={pageClasses}>
      <form className={cardClasses} onSubmit={onSubmit}>
        <Image
          src="/aws-logo.png"
          alt="AWS Builders – UST"
          width={117}
          height={66}
          className="mb-6 h-8 w-auto"
        />
        <p className={eyebrowClasses}>$ auth login</p>
        <h1 className={titleClasses}>HR sign in</h1>

        <div className={`${fieldClasses} mt-6`}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className={`${fieldClasses} mt-4`}>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className={`${errorClasses} mt-4`}>{error}</p> : null}

        <Button
          type="submit"
          color="cyan"
          className={submitClasses}
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  )
}
