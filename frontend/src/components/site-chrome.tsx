"use client"

import { usePathname } from "next/navigation"
import { ApplyAdminChrome } from "@/components/apply-admin-chrome"
import { Navbar } from "@/components/navbar"

function isApplyPath(pathname: string) {
  return pathname.startsWith("/apply")
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin")
}

export function SiteChrome() {
  const pathname = usePathname()

  if (isAdminPath(pathname)) return null
  return isApplyPath(pathname) ? <ApplyAdminChrome /> : <Navbar />
}
