import { PositionsPageClient } from "@/components/positions-page-client"

export default function PositionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-4 md:px-10">
      <PositionsPageClient />
    </main>
  )
}
