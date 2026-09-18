"use client"

import { useState, type MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DesktopNavLinks, type DesktopNavItem } from "@/components/site/desktop-nav-links"
import { NavbarMobileMenu } from "@/components/site/navbar-mobile-menu"
import { useNavbarActiveHref } from "@/hooks/use-navbar-active-href"
import { logoutApplicant } from "@/lib/api/applicant"
import { scrollToSection } from "@/lib/site/scroll-to-section"
import { chromeBarClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const headerClasses = "fixed inset-x-0 top-0 z-50"
const barInnerClasses =
  "mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-2.5 sm:px-7 lg:px-8 xl:gap-8"
const barInnerMarketingClasses = "lg:justify-center lg:gap-6"
const barInnerApplicantClasses = "justify-between"
const logoLinkClasses = "flex shrink-0 items-center gap-2 font-bold"
const logoWordmarkClasses = "hidden sm:inline lg:hidden xl:inline"
const desktopCtaWrapClasses = "hidden lg:block"
const mobileMenuButtonWrapClasses = "lg:hidden"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { activeHref, navItems } = useNavbarActiveHref(pathname)
  const isApplicantSignedIn = pathname.startsWith("/apply/dashboard")

  if (pathname.startsWith("/admin") || pathname === "/login") return null

  function navigateToSection(
    event: MouseEvent<HTMLAnchorElement>,
    item: DesktopNavItem,
  ) {
    if (pathname !== item.path || !item.sectionId) return
    event.preventDefault()
    scrollToSection(item.sectionId)
    window.history.replaceState(null, "", item.href)
  }

  async function onApplicantSignOut() {
    await logoutApplicant()
    router.replace("/apply/status")
  }

  return (
    <header className={headerClasses}>
      <nav aria-label="Primary" className={chromeBarClasses}>
        <div
          className={cn(
            barInnerClasses,
            isApplicantSignedIn
              ? barInnerApplicantClasses
              : barInnerMarketingClasses,
          )}
        >
          <Link
            href={isApplicantSignedIn ? "/apply/dashboard" : "/"}
            className={logoLinkClasses}
            onClick={(event) => {
              if (isApplicantSignedIn) return
              navigateToSection(event, navItems[0])
            }}
          >
            <Image
              src="/aws-logo.png"
              alt="AWS Builders – UST"
              width={117}
              height={66}
              className="h-8 w-auto"
            />
            <span
              className={
                isApplicantSignedIn ? "inline text-blue-chalk" : logoWordmarkClasses
              }
            >
              AWS Builders – UST
            </span>
          </Link>

          {isApplicantSignedIn ? null : (
            <DesktopNavLinks
              items={navItems}
              activeHref={activeHref}
              onNavigate={navigateToSection}
            />
          )}

          <div
            className={cn(
              isApplicantSignedIn ? "ml-auto shrink-0" : desktopCtaWrapClasses,
            )}
          >
            {isApplicantSignedIn ? (
              <Button
                type="button"
                color="purple"
                className="h-9 rounded-pill px-4 font-mono text-xs"
                onClick={() => void onApplicantSignOut()}
              >
                Sign out
              </Button>
            ) : (
              <Button
                color="cyan"
                nativeButton={false}
                render={<Link href="/apply/positions" />}
              >
                Apply now!
              </Button>
            )}
          </div>

          {isApplicantSignedIn ? null : (
            <div className={mobileMenuButtonWrapClasses}>
              <button
                type="button"
                aria-label="Show menu"
                aria-expanded={open}
                className="inline-flex size-10 items-center justify-center rounded-pill text-blue-chalk hover:bg-biloba-flower/15"
                onClick={() => setOpen((current) => !current)}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          )}
        </div>
      </nav>

      {isApplicantSignedIn ? null : (
        <NavbarMobileMenu
          open={open}
          activeHref={activeHref}
          items={navItems}
          onClose={() => setOpen(false)}
          onNavigate={navigateToSection}
        />
      )}
    </header>
  )
}
