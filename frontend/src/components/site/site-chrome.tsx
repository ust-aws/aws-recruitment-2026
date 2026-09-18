"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/site/navbar"

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin")
}

export function SiteChrome() {
  const pathname = usePathname()

  if (isAdminPath(pathname)) return null
  return <Navbar />
}
