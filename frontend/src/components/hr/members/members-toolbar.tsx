"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fieldControlClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

// One row from lg up: search, the filters, then Export. Below that: search, a
// row with Filters and Export, then the filters when opened.
const wrapClasses = "mt-6 flex flex-col gap-3 lg:flex-row lg:items-center"
const searchWrapClasses = "relative lg:order-1 lg:min-w-56 lg:flex-1"
const searchClasses = cn(fieldControlClasses, "border border-blue-chalk/20 lg:pr-14")
const keycapClasses =
  "pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-blue-chalk/25 px-2 py-0.5 font-mono text-xs text-prelude lg:block"
const mobileRowClasses = "grid grid-cols-2 gap-3 lg:contents"
const toggleClasses =
  "flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-[20px] border border-blue-chalk/20 bg-haiti/70 px-4 font-sans text-sm text-blue-chalk outline-none transition-colors hover:border-biloba-flower/50 focus-visible:ring-2 focus-visible:ring-aquamarine/40 lg:hidden"
const activeCountClasses =
  "rounded-pill bg-aquamarine px-2 py-0.5 font-sans text-xs font-semibold text-haiti"
const actionsClasses = "lg:order-3 lg:flex lg:shrink-0"
const filtersClasses = "flex-col gap-3 lg:order-2 lg:flex lg:flex-row lg:items-center"

function typingInField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

type MembersToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  placeholder: string
  /** How many filters are narrowing the list, shown on the phone Filters button. */
  activeFilters: number
  /** The dropdown, view switch and links. Behind a Filters button on small screens. */
  filters: ReactNode
  /** Export beside the search box. */
  actions: ReactNode
}

export function MembersToolbar({
  query,
  onQueryChange,
  placeholder,
  activeFilters,
  filters,
  actions,
}: MembersToolbarProps) {
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" jumps to the search box, like most tools officers already use.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || typingInField(event.target)) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className={wrapClasses}>
      <div className={searchWrapClasses}>
        <Input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search members"
          aria-keyshortcuts="/"
          className={searchClasses}
        />
        {query ? null : (
          <kbd aria-hidden className={keycapClasses}>
            /
          </kbd>
        )}
      </div>
      <div className={mobileRowClasses}>
        <button
          type="button"
          className={toggleClasses}
          aria-expanded={open}
          aria-controls="members-filters"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-prelude" aria-hidden />
            Filters
          </span>
          {activeFilters > 0 ? <span className={activeCountClasses}>{activeFilters}</span> : null}
        </button>
        <div className={actionsClasses}>{actions}</div>
      </div>
      <div id="members-filters" className={cn(filtersClasses, open ? "flex" : "hidden")}>
        {filters}
      </div>
    </div>
  )
}
