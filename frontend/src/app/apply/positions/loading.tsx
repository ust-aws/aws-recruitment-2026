const loadingPanelClasses =
  "glass flex min-h-72 items-center justify-center rounded-[28px] border border-blue-chalk/20 bg-haiti/30 px-6"
const loadingTextClasses =
  "font-mono text-xs uppercase tracking-wide text-aquamarine"

export default function PositionsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-16">
      <div role="status" className={loadingPanelClasses}>
        <p className={loadingTextClasses}>Loading open positions…</p>
      </div>
    </main>
  )
}
