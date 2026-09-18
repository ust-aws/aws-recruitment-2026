import dynamic from "next/dynamic"
import { Hero } from "@/components/home/hero"
import { HomeSplash } from "@/components/home/splash"

const HomeDeferredSections = dynamic(() =>
  import("@/components/home/deferred-sections").then(
    (mod) => mod.HomeDeferredSections,
  ),
)

export default function Home() {
  return (
    <>
      <HomeSplash />
      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-4 pb-12 pt-16 md:pb-16">
        <Hero />
        <HomeDeferredSections />
      </main>
    </>
  )
}
