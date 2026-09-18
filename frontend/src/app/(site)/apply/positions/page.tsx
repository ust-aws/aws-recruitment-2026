import { Suspense } from "react"
import { PositionsBrowser } from "@/components/positions/browser"
import { PositionsBrowserSkeleton } from "@/components/positions/browser-skeleton"
import { listServerBrowserPositions } from "@/lib/positions/server"
import { applyFlowShellClasses } from "@/lib/site/surface"

async function PositionsContent() {
  const positions = await listServerBrowserPositions().catch(() => null)
  return positions ? <PositionsBrowser positions={positions} /> : <PositionsBrowser positions={[]} loadError />
}

export default function PositionsPage() {
  return (
    <main className={`${applyFlowShellClasses} gap-10`}>
      <Suspense fallback={<PositionsBrowserSkeleton />}>
        <PositionsContent />
      </Suspense>
    </main>
  )
}
