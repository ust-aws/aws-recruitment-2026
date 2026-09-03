"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Hamburger from "hamburger-react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "People", href: "/people" },
  { label: "Careers", href: "/careers" },
  { label: "Events", href: "/events" },
  { label: "Shop", href: "/shop" },
]

const headerClasses = "fixed inset-x-0 top-0 z-50"
const barClasses =
  "border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300"
const topBarClasses = "border-transparent bg-transparent"
const scrolledBarClasses = "glass border-blue-chalk/15 bg-haiti/70"
const barInnerClasses =
  "mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-2.5"
const desktopLinksClasses =
  "hidden items-center gap-1 rounded-pill font-mono text-sm text-prelude md:flex"
const navLinkClasses =
  "rounded-pill px-3 py-1.5 transition-colors hover:text-blue-chalk"
const activeNavLinkClasses = "bg-aquamarine text-haiti hover:text-haiti"
const mobileOverlayClasses =
  "fixed inset-0 z-40 transition-[opacity,visibility] duration-300 md:hidden"
const mobileOverlayOpenClasses = "visible pointer-events-auto opacity-100"
const mobileOverlayClosedClasses = "invisible pointer-events-none opacity-0"
const mobileBackdropClasses = "absolute inset-0 glass bg-haiti/80"
const mobilePanelInnerClasses =
  "relative mx-auto flex h-full max-w-[1180px] flex-col items-center justify-center gap-3 px-4 font-mono text-2xl text-prelude"
const mobileCloseButtonClasses =
  "absolute top-4 right-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-pill text-blue-chalk transition-colors hover:bg-biloba-flower/15 hover:text-aquamarine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine"
const mobileNavLinkClasses =
  "rounded-pill px-5 py-2 transition-colors hover:bg-biloba-flower/15 hover:text-blue-chalk"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 20)

    updateScrolled()
    window.addEventListener("scroll", updateScrolled, { passive: true })
    return () => window.removeEventListener("scroll", updateScrolled)
  }, [])

  return (
    <header className={headerClasses}>
      <nav
        aria-label="Primary"
        className={cn(barClasses, scrolled ? scrolledBarClasses : topBarClasses)}
      >
        <div className={barInnerClasses}>
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image src="/aws-logo.png" alt="AWS Builders – UST" width={117} height={66} className="h-8 w-auto" />
            <span className="hidden sm:inline">AWS Builders – UST</span>
          </Link>

          <div className={desktopLinksClasses}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  navLinkClasses,
                  pathname === item.href && activeNavLinkClasses
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Button color="cyan" nativeButton={false} render={<Link href="/apply" />}>
              Apply now!
            </Button>
          </div>

          <div className="md:hidden">
            <Hamburger
              toggled={open}
              toggle={setOpen}
              size={20}
              color="#F3EEFF"
              duration={0.3}
              rounded
              label="Show menu"
            />
          </div>
        </div>
      </nav>

      <div
        className={cn(
          mobileOverlayClasses,
          open ? mobileOverlayOpenClasses : mobileOverlayClosedClasses
        )}
      >
        <button
          type="button"
          className={mobileBackdropClasses}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <div className={mobilePanelInnerClasses}>
          <button
            type="button"
            className={mobileCloseButtonClasses}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden="true" className="size-6" />
          </button>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                mobileNavLinkClasses,
                pathname === item.href && activeNavLinkClasses
              )}
            >
              {item.label}
            </Link>
          ))}
          <Button color="cyan" className="mt-2" onClick={() => setOpen(false)}>
            Apply now!
          </Button>
        </div>
      </div>
    </header>
  )
}
