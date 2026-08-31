import { connection } from "next/server"
import { PositionsBrowser } from "@/components/positions-browser"
import type { Position } from "@/lib/positions"

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8787"

function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false

  const position = value as Record<string, unknown>
  const stringFields = [
    "id",
    "title",
    "office",
    "committee",
    "committeeDescription",
    "description",
  ]

  return (
    stringFields.every((field) => typeof position[field] === "string") &&
    Array.isArray(position.responsibilities) &&
    position.responsibilities.every(
      (responsibility) => typeof responsibility === "string"
    ) &&
    typeof position.isOpen === "boolean"
  )
}

async function getOpenPositions() {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/positions`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Positions API returned ${response.status}`)
  }

  const body: unknown = await response.json()

  if (!Array.isArray(body) || !body.every(isPosition)) {
    throw new Error("Positions API returned an invalid response")
  }

  return body
}

export default async function PositionsPage() {
  await connection()

  let positions: Position[] = []
  let loadError = false

  try {
    positions = await getOpenPositions()
  } catch (error) {
    loadError = true
    console.error("Unable to load open positions", error)
  }

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-16 pt-16">
      <PositionsBrowser positions={positions} loadError={loadError} />
    </main>
  )
}
