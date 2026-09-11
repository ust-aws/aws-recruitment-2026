"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { logoutApplicant } from "@/lib/applicant-api"
import { chromeBarClasses } from "@/lib/surface"

const headerClasses = `sticky top-0 z-50 ${chromeBarClasses}`
const innerClasses =
  "mx-auto flex max-w-[1180px] items-center gap-2 px-4 py-4 md:px-10 md:py-5"
const topRowClasses =
  "flex w-full items-center gap-2 font-mono text-xs tracking-wide text-prelude"
const brandClasses = "font-sans text-sm font-semibold text-blue-chalk"
const crumbClasses = "text-prelude/70"
const slashClasses = "text-prelude/40"
const trailingActionClasses = "ml-auto"

function crumbsFor(pathname: string) {
  if (pathname.startsWith("/apply")) return ["apply"]
  return pathname.split("/").filter(Boolean)
}

export function ApplyAdminChrome() {
  const pathname = usePathname()
  const router = useRouter()
  const crumbs = crumbsFor(pathname)
  const isApplyFlow = pathname.startsWith("/apply")
  const isApplicantDashboard = pathname.startsWith("/apply/dashboard")

  async function onApplicantSignOut() {
    await logoutApplicant()
    router.replace("/apply/status")
  }

  return (
    <header className={headerClasses}>
      <div className={innerClasses}>
        <div className={topRowClasses}>
          <Link href="/" className={brandClasses}>
            AWS Builders - UST
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb} className={crumbClasses}>
              <span className={slashClasses}> /</span>
              {crumb}
            </span>
          ))}
          {isApplicantDashboard ? (
            <Button
              type="button"
              color="purple"
              className={trailingActionClasses}
              onClick={() => void onApplicantSignOut()}
            >
              Sign out
            </Button>
          ) : isApplyFlow ? (
            <Button
              color="purple"
              className={trailingActionClasses}
              nativeButton={false}
              render={<Link href="/" />}
            >
              ← Back to Home
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
