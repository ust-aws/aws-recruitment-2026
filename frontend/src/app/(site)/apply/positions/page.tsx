import { PositionsBrowser } from "@/components/positions-browser"
import type { Position } from "@/lib/positions"

export const dynamic = "force-dynamic"

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787"

type PositionResponse = {
  id: string
  title: string
  office: string
  committee_id: string
  committee: string
  committeeDescription: string
  description: string
  responsibilities: string
  isOpen: boolean
}

function isPositionResponse(value: unknown): value is PositionResponse {
  if (!value || typeof value !== "object") return false

  const position = value as Record<string, unknown>
  const stringFields = [
    "id",
    "title",
    "office",
    "committee_id",
    "committee",
    "committeeDescription",
    "description",
    "responsibilities",
  ]

  return (
    stringFields.every((field) => typeof position[field] === "string") &&
    typeof position.isOpen === "boolean"
  )
}

function toPosition(response: PositionResponse): Position {
  return {
    id: response.id,
    title: response.title,
    office: response.office,
    committee: response.committee,
    committeeDescription: response.committeeDescription,
    description: response.description,
    responsibilities: response.responsibilities
      .split(/\r?\n/)
      .map((responsibility) => responsibility.trim())
      .filter(Boolean),
    isOpen: response.isOpen,
  }
}

async function getOpenPositions() {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/positions`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Positions API returned ${response.status}`)
  }

  const body: unknown = await response.json()

  if (!Array.isArray(body) || !body.every(isPositionResponse)) {
    throw new Error("Positions API returned an invalid response")
  }

  return body.map(toPosition)
}

export default async function PositionsPage() {
  let positions: Position[] = []
  let loadError = false

  try {
    positions = await getOpenPositions()
  } catch (error) {
    loadError = true
    console.error("Unable to load open positions", error)
  }

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-4 md:px-10">
      <PositionsBrowser positions={positions} loadError={loadError} />
    </main>
  )
}
