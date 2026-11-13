type HrSectionNavItem = {
  id: string
  label: string
}

const navClasses =
  "glass mt-6 flex max-w-full items-center gap-2 overflow-x-auto rounded-[18px] border border-blue-chalk/15 bg-haiti/45 p-2 panel-scroll"
const labelClasses =
  "hidden shrink-0 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-prelude lg:block"
const linkClasses =
  "shrink-0 rounded-[12px] border border-transparent px-3 py-2 font-sans text-xs font-medium text-prelude transition-colors hover:border-biloba-flower/30 hover:bg-meteorite/50 hover:text-blue-chalk focus-visible:border-aquamarine/50 focus-visible:text-blue-chalk"

export function HrSectionNav({
  items,
  showIndex = true,
}: {
  items: HrSectionNavItem[]
  showIndex?: boolean
}) {
  return (
    <nav aria-label="On this page" className={navClasses}>
      <span className={labelClasses}>On this page</span>
      {items.map((item, index) => (
        <a key={item.id} href={"#" + item.id} className={linkClasses}>
          {showIndex ? (
            <span className="mr-1.5 font-mono text-aquamarine">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
          {item.label}
        </a>
      ))}
    </nav>
  )
}
