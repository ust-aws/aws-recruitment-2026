import { ApplyFormGate } from "@/components/apply/form/apply-form-gate"

export default async function ApplyFormPage({
  searchParams,
}: PageProps<"/apply/form">) {
  const { position } = await searchParams
  const initialPositionId = typeof position === "string" ? position : undefined

  return <ApplyFormGate initialPositionId={initialPositionId} />
}
