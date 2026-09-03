"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const headerClasses = "border-b border-biloba-flower/35"
const innerClasses =
  "mx-auto flex max-w-[1180px] items-center gap-2 px-4 py-5 font-mono text-xs tracking-wide text-prelude md:px-10"
const brandClasses = "font-sans text-sm font-semibold text-blue-chalk"
const crumbClasses = "text-prelude/70"
const slashClasses = "text-prelude/40"

function crumbsFor(pathname: string) {
  if (pathname.startsWith("/admin")) return ["admin", "hr"]
  if (pathname.startsWith("/apply")) return ["apply"]
  return pathname.split("/").filter(Boolean)
}

export function ApplyAdminChrome() {
  const pathname = usePathname()
  const crumbs = crumbsFor(pathname)

  return (
    <header className={headerClasses}>
      <div className={innerClasses}>
        <Link href="/" className={brandClasses}>
          AWS Builders - UST
        </Link>
        {crumbs.map((crumb) => (
          <span key={crumb} className={crumbClasses}>
            <span className={slashClasses}> /</span>
            {crumb}
          </span>
        ))}
      </div>
    </header>
  )
}
