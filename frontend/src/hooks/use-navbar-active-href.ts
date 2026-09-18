import { useEffect, useState } from "react"
import { useSectionSpy } from "@/hooks/use-section-spy"
import { SITE_NAV_ITEMS } from "@/lib/site/nav"

const NAV_ITEMS = SITE_NAV_ITEMS
const HOME_SECTION_IDS = NAV_ITEMS.flatMap((item) =>
  item.path === "/" && "sectionId" in item ? [item.sectionId] : [],
)

export function useNavbarActiveHref(pathname: string) {
  const [pendingSectionHref, setPendingSectionHref] = useState<string | null>(
    null,
  )
  const activeSectionId = useSectionSpy(pathname, HOME_SECTION_IDS)
  const spyActiveHref =
    pathname === "/"
      ? NAV_ITEMS.find((item) => "sectionId" in item && item.sectionId === activeSectionId)?.href ?? "/"
      : NAV_ITEMS.find((item) => item.path === pathname)?.href ?? ""
  const activeHref = pendingSectionHref ?? spyActiveHref

  useEffect(() => {
    if (pendingSectionHref && pendingSectionHref === spyActiveHref) {
      setPendingSectionHref(null)
    }
  }, [pendingSectionHref, spyActiveHref])

  return { activeHref, setPendingSectionHref, navItems: NAV_ITEMS }
}
