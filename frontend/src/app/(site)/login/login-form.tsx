"use client"

import { useActionState, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction, type LoginState } from "./actions"
import { LoginSky } from "./login-sky"

// Phones: sky band on top, form below. lg+: form column left, sky fills the rest.
const pageClasses =
  "grid min-h-svh flex-1 grid-rows-[auto_1fr] bg-haiti caret-blue-chalk selection:bg-biloba-flower/35 selection:text-blue-chalk lg:grid-cols-[minmax(26rem,35rem)_minmax(0,1fr)] lg:grid-rows-none"
const columnClasses =
  "relative z-10 flex flex-col gap-12 border-blue-chalk/12 bg-haiti px-6 py-10 sm:px-12 lg:order-first lg:justify-between lg:border-r lg:px-16 lg:py-14"
const brandClasses = "flex w-fit items-center gap-3 font-sans text-base font-bold text-blue-chalk"
const formClasses = "flex w-full max-w-sm flex-col"
const eyebrowClasses = "font-mono text-xs font-medium tracking-wide text-biloba-flower"
const titleClasses =
  "mt-3 font-sans text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-balance text-blue-chalk md:text-[2.75rem]"
const subtitleClasses = "mt-3 font-sans text-[0.9375rem] leading-relaxed text-prelude"
const fieldClasses = "flex flex-col gap-2"
const labelClasses = "font-mono text-xs normal-case text-prelude"
const errorId = "login-error"
const inputClasses = "h-12 rounded-[20px] px-4"
const passwordInputClasses = "pr-12"
const visibilityToggleClasses =
  "absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-prelude transition-colors hover:text-blue-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"
const errorPanelClasses =
  "mt-5 rounded-[14px] border border-destructive/35 bg-destructive/10 px-3 py-2.5 font-sans text-sm text-destructive"
const submitClasses = "mt-7 h-12 w-full"
const backLinkClasses =
  "inline-flex w-fit items-center gap-2 rounded-pill font-sans text-sm text-prelude underline-offset-4 transition-colors hover:text-blue-chalk hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-aquamarine"

const initialState: LoginState = {}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const hasError = Boolean(state.error)

  return (
    <main className={pageClasses}>
      <LoginSky rising={pending} />

      <div className={columnClasses}>
        <Link href="/" className={brandClasses}>
          <Image src="/aws-logo.webp" alt="" width={117} height={66} className="h-8 w-auto" />
          <span className="max-lg:sr-only">AWS Builders – UST</span>
        </Link>

        <form action={formAction} className={formClasses} noValidate>
          <p className={eyebrowClasses}>$ auth login --staff</p>
          <h1 className={titleClasses}>Good to see you, Builder.</h1>
          <p className={subtitleClasses}>
            Sign in with your own officer account. We&rsquo;ll open the dashboard for your team.
          </p>

          <div className={`${fieldClasses} mt-9`}>
            <Label htmlFor="email" className={labelClasses}>Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="Enter your email"
              className={inputClasses}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
              autoFocus
              required
            />
          </div>

          <div className={`${fieldClasses} mt-5`}>
            <Label htmlFor="password" className={labelClasses}>Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`${inputClasses} ${passwordInputClasses}`}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
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

          {state.error ? (
            <p id={errorId} className={errorPanelClasses} role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" color="cyan" className={submitClasses} disabled={pending}>
            {pending ? "Signing In…" : "Sign In"}
          </Button>
        </form>

        <Link href="/" className={backLinkClasses}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </main>
  )
}
