import Image from "next/image"
import { SectionHeader } from "@/components/shared/section-header"

const INTRO =
  "Here with us is Espi, our organization's mascot! With her pink wings and cloud-inspired charm, she aims to soar through the skies with a touch of magic to cloud learning. You'll see her guiding you throughout the site."
const ESPI_CAPTION =
  "Our org has a very simple mission and it's shaped by the vision of the people behind this SOOOO AMAZING org!"

const PILLARS = [
  {
    label: "Mission",
    body: "Our mission is to provide accessible and comprehensive AWS education to students at UST. We aim to bridge the gap between theoretical knowledge and practical cloud computing skills, empowering our members to excel in the rapidly evolving tech industry.",
  },
  {
    label: "Vision",
    body: "To become the leading AWS student community in the Philippines, fostering innovation, collaboration, and excellence in cloud computing education while building a strong network of future cloud professionals.",
  },
] as const

const sectionClasses = "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)]"
// The identity header runs wider than SectionHeader's default measures.
const headerWidthClasses = "[&>h2]:max-w-[46rem] [&>p:last-child]:max-w-[60rem]"
const bodyClasses =
  "grid grid-cols-1 items-center gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-2"
const figureClasses = "flex flex-col items-center gap-5"
const imageWrapperClasses =
  "relative aspect-square w-full max-w-[26rem] drop-shadow-[0_0_48px_rgba(183,140,240,0.28)]"
const captionClasses =
  "max-w-[24rem] text-center text-sm leading-relaxed text-prelude"
const pillarsClasses = "flex flex-col gap-8"
const pillarClasses = "flex flex-col items-start gap-3"
const pillClasses =
  "rounded-pill border border-biloba-flower/30 bg-daisy-bush/35 px-4 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-blue-chalk"
const pillarBodyClasses =
  "border-l border-biloba-flower/25 pl-4 text-base leading-relaxed text-pretty text-justify text-prelude"

export function MissionVision() {
  return (
    <section
      id="our-identity"
      aria-labelledby="our-identity-title"
      className={`${sectionClasses} scroll-mt-20`}
    >
      <SectionHeader
        className={headerWidthClasses}
        eyebrow="// our identity"
        title={<span id="our-identity-title">Get to know more about us.</span>}
        subtitle={INTRO}
      />

      <div className={bodyClasses}>
        <figure className={figureClasses}>
          <div className={imageWrapperClasses}>
            <Image
              src="/espi.png"
              alt="Espi, the AWS Builders – UST mascot"
              fill
              sizes="(min-width: 1024px) 26rem, 100vw"
              className="object-contain"
              priority
            />
          </div>
          <figcaption className={captionClasses}>{ESPI_CAPTION}</figcaption>
        </figure>

        <div className={pillarsClasses}>
          {PILLARS.map((pillar) => (
            <article key={pillar.label} className={pillarClasses}>
              <h3 className={pillClasses}>{pillar.label}</h3>
              <p className={pillarBodyClasses}>{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
