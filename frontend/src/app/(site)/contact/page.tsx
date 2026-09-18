import type { Metadata } from "next"
import { ContactSection } from "@/components/home/contact-section"

export const metadata: Metadata = {
  title: "Contact – AWS Builders – UST",
  description:
    "Email AWS Builders – UST for general inquiries, sponsorships, or partnerships.",
}

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 pb-16 pt-20 md:px-10 md:pt-24">
      <ContactSection />
    </main>
  )
}
