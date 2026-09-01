import { PositionsBrowser } from "@/components/positions-browser"

export default function PositionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-16">
      <PositionsBrowser />
    </main>
  )
}