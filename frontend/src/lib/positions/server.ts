import type { Position } from "@/lib/positions"

const API_BASE = process.env.API_URL ?? "http://localhost:8787"

type PositionApiRow = Omit<Position, "responsibilities"> & {
  responsibilities: string
}

export async function listServerBrowserPositions(): Promise<Position[]> {
  const response = await fetch(`${API_BASE}/positions`, { cache: "no-store" })
  if (!response.ok) throw new Error("Could not load open positions.")

  const rows = (await response.json()) as PositionApiRow[]
  return rows.map((row) => ({
    ...row,
    responsibilities: row.responsibilities
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  }))
}
