import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hero } from "@/components/hero"
import { Committees } from "@/components/committees"
import { FAQSection } from "@/components/faq-section"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-4 pt-16">
      <Hero />
      <Committees />
      <FAQSection />
      <div className="flex flex-wrap items-center gap-4">
        <Button color="cyan" nativeButton={false} render={<Link href="/apply" />}>
          Apply now!
        </Button>
        <Button color="purple">Committee Directors</Button>
      </div>
    </main>
  )
}

