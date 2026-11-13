import { redirect } from "next/navigation"
import { HrPaymentsPage } from "@/components/hr/payments/hr-payments-page"
import { PAYMENT_SETUP_HREF, parsePaymentTab } from "@/lib/payments/workspace"

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/hr/payments">) {
  const { tab } = await searchParams
  // Setup used to be a tab here; old links land on its own page.
  if (tab === "setup") redirect(PAYMENT_SETUP_HREF)
  return <HrPaymentsPage initialTab={parsePaymentTab(tab)} />
}
