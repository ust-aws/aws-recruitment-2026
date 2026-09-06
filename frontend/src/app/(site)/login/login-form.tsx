"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, login } from "@/lib/api"

const pageClasses =
  "relative flex min-h-svh flex-1 flex-col items-center justify-center px-4 py-12 md:py-16"
const dotConstellationLayerClasses =
  "pointer-events-none absolute inset-0 z-0 overflow-hidden text-blue-chalk/35 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_76%)]"
const dotConstellationSvgClasses =
  "absolute inset-0 h-full w-full [mask-image:linear-gradient(180deg,transparent_0%,black_6%,black_62%,transparent_94%)]"
const cardClasses =
  "glass reveal relative z-10 w-full max-w-md rounded-[20px] border border-blue-chalk/20 bg-meteorite/55 p-8 md:p-10"
const eyebrowClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const titleClasses = "mt-1 font-sans text-2xl font-bold text-blue-chalk md:text-[1.65rem]"
const subtitleClasses = "mt-2 font-sans text-sm leading-relaxed text-prelude"
const fieldClasses = "flex flex-col gap-2"
const passwordWrapClasses = "relative"
const visibilityToggleClasses =
  "absolute top-1/2 right-3 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-md p-1 text-prelude transition-colors hover:text-blue-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"
const passwordInputClasses = "pr-10"
const errorPanelClasses =
  "mt-4 rounded-[14px] border border-destructive/35 bg-destructive/10 px-3 py-2.5 font-sans text-sm text-destructive"
const submitClasses = "mt-6 h-11 w-full"
const backHomeClasses =
  "mt-4 block text-center font-sans text-sm text-prelude underline-offset-4 transition-colors hover:text-blue-chalk hover:underline"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const hasError = error !== null

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email, password)
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
      <div className={dotConstellationLayerClasses} aria-hidden="true">
        <svg className={dotConstellationSvgClasses}>
          <defs>
            <pattern
              id="loginDotField"
              width="240"
              height="240"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="28" cy="34" r="1.35" fill="currentColor" opacity="0.68" />
              <circle cx="74" cy="16" r="1.15" fill="currentColor" opacity="0.5" />
              <circle cx="118" cy="48" r="1.25" fill="currentColor" opacity="0.62" />
              <circle cx="168" cy="30" r="1.1" fill="currentColor" opacity="0.48" />
              <circle cx="42" cy="92" r="1.3" fill="currentColor" opacity="0.58" />
              <circle cx="96" cy="108" r="1.15" fill="currentColor" opacity="0.64" />
              <circle cx="148" cy="82" r="1.4" fill="currentColor" opacity="0.54" />
              <circle cx="192" cy="118" r="1.1" fill="currentColor" opacity="0.46" />
              <circle cx="18" cy="154" r="1.2" fill="currentColor" opacity="0.56" />
              <circle cx="62" cy="178" r="1.35" fill="currentColor" opacity="0.64" />
              <circle cx="132" cy="162" r="1.15" fill="currentColor" opacity="0.54" />
              <circle cx="204" cy="186" r="1.25" fill="currentColor" opacity="0.5" />
              <circle cx="88" cy="58" r="1" fill="currentColor" opacity="0.44" />
              <circle cx="176" cy="68" r="1.15" fill="currentColor" opacity="0.56" />
              <circle cx="214" cy="42" r="1.2" fill="currentColor" opacity="0.52" />
              <circle cx="124" cy="128" r="1.05" fill="currentColor" opacity="0.48" />
              <circle cx="52" cy="128" r="1.1" fill="currentColor" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginDotField)" />
        </svg>
      </div>

      <form className={cardClasses} onSubmit={onSubmit} noValidate>
        <p className={eyebrowClasses}>$ auth login</p>
        <h1 className={titleClasses}>HR Sign In</h1>
        <p className={subtitleClasses}>
          Use your HR credentials to review applications.
        </p>

        <div className={`${fieldClasses} mt-8`}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={hasError}
            required
          />
        </div>

        <div className={`${fieldClasses} mt-4`}>
          <Label htmlFor="password">Password</Label>
          <div className={passwordWrapClasses}>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={passwordInputClasses}
              aria-invalid={hasError}
              required
            />
            <button
              type="button"
              className={visibilityToggleClasses}
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className={errorPanelClasses} role="alert">{error}</p>
        ) : null}

        <Button
          type="submit"
          color="cyan"
          className={submitClasses}
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <Link href="/" className={backHomeClasses}>
          Back home
        </Link>
      </form>
    </main>
  )
}
