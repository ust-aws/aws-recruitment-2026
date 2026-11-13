import type { Metadata } from "next"
import { OfficerHuntGate } from "@/components/apply/form/officer-hunt-gate"

export const metadata: Metadata = {
  title: "Officer Hunt",
  description: "Run for the AWS Builders – UST board, a director seat or executive assistant.",
}

export default function OfficerHuntPage() {
  return <OfficerHuntGate />
}
