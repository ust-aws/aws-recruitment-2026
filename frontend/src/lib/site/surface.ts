/** Multi-line display headings — slightly open so stacked lines don't collide. */
export const displayTitleLeadingClasses = "leading-[1.15]"

export const pageShellClasses =
  "mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 py-10 md:px-10"

/** Extra start padding so 1180px chrome reads centered when the scrollbar eats end space. */
export const chromeInsetClasses = "pl-7 pr-3 md:pl-14 md:pr-8"

export const applyFlowInsetClasses = chromeInsetClasses

/** Apply flow pages (positions, form, status) — matches navbar inset so content stays centered on narrow viewports. */
export const applyFlowShellClasses =
  `mx-auto flex w-full min-w-0 max-w-[1180px] flex-1 flex-col overflow-x-clip pb-16 pt-4 ${applyFlowInsetClasses}`

export const glassPanelClasses =
  "glass rounded-[28px] border border-biloba-flower/35 bg-meteorite/45"

export const chromeBarClasses =
  "glass border-b border-blue-chalk/15 bg-haiti/70"

export const fieldLabelClasses =
  "font-sans text-sm font-medium text-blue-chalk"

export const requiredMarkClasses = "ml-1 text-aquamarine"

export const fieldControlClasses =
  "h-12 w-full data-[size=default]:h-12 rounded-[20px] border-0 bg-haiti/70 px-4 text-sm text-blue-chalk placeholder:text-prelude/60 focus-visible:border-aquamarine/40 focus-visible:ring-2 focus-visible:ring-aquamarine/30"

export const ghostPillButtonClasses =
  "h-10 rounded-pill border border-blue-chalk/25 bg-transparent px-5 font-mono text-xs text-blue-chalk hover:bg-blue-chalk/10"

export const positionsLinkClasses =
  "text-center font-sans text-sm text-prelude underline-offset-4 hover:text-blue-chalk hover:underline"
