"use client"

import Link from "next/link"
import type { MouseEvent } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DesktopNavItem } from "@/components/site/desktop-nav-links"
import { cn } from "@/lib/utils"

const mobileOverlayClasses =
  "fixed inset-0 z-40 transition-[opacity,visibility] duration-300 lg:hidden"
const mobileOverlayOpenClasses = "visible pointer-events-auto opacity-100"
const mobileOverlayClosedClasses = "invisible pointer-events-none opacity-0"
const mobileBackdropClasses = "absolute inset-0 glass bg-haiti/80"
const mobilePanelInnerClasses =
  "relative mx-auto flex h-full max-w-[1180px] flex-col items-center justify-center gap-3 px-4 font-mono text-2xl text-prelude"
const mobileCloseButtonClasses =
  "absolute top-4 right-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-pill text-blue-chalk transition-colors hover:bg-biloba-flower/15 hover:text-aquamarine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine"
const mobileNavLinkClasses =
  "rounded-pill px-5 py-2 transition-colors hover:bg-biloba-flower/15 hover:text-blue-chalk"
const activeNavLinkClasses = "bg-aquamarine text-haiti hover:text-haiti"

type NavbarMobileMenuProps = {
  open: boolean
  activeHref: string
  items: readonly DesktopNavItem[]
  onClose: () => void
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    item: DesktopNavItem,
  ) => void
}

export function NavbarMobileMenu({
  open,
  activeHref,
  items,
  onClose,
  onNavigate,
}: NavbarMobileMenuProps) {
  return (
    <div
      className={cn(
        mobileOverlayClasses,
        open ? mobileOverlayOpenClasses : mobileOverlayClosedClasses,
      )}
    >
      <button
        type="button"
        className={mobileBackdropClasses}
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className={mobilePanelInnerClasses}>
        <button
          type="button"
          className={mobileCloseButtonClasses}
          aria-label="Close menu"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-6" />
        </button>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={(event) => {
              onNavigate(event, item)
              onClose()
            }}
            className={cn(
              mobileNavLinkClasses,
              activeHref === item.href && activeNavLinkClasses,
            )}
          >
            {item.label}
          </Link>
        ))}
        <Button
          color="cyan"
          className="mt-2"
          nativeButton={false}
          render={<Link href="/apply/positions" onClick={onClose} />}
        >
          Apply now!
        </Button>
      </div>
    </div>
  )
}
