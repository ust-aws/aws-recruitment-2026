import { SectionHeader } from "@/components/shared/section-header"

const INTRO =
  "AWS Builders – UST is a chapter of a global, student-led network of AWS Student Builder Groups — we don't stay inside campus walls. We're part of a thriving cloud and AI community spread across chapters in the Philippines and around the world."

const emphasisClasses = "italic text-blue-chalk"

const CHAPTER_TAGS = [
  "Manila",
  "Cebu",
  "Davao",
  "+ chapters nationwide",
  "+ chapters worldwide",
] as const

const sectionClasses = "mt-10 flex w-full flex-col gap-4 md:mt-16"
const headerWidthClasses = "[&>h2]:max-w-[46rem] [&>p:last-child]:max-w-[60rem]"
const tagsClasses = "flex flex-wrap gap-2"
const tagClasses =
  "rounded-pill border border-blue-chalk/25 px-4 py-1.5 font-mono text-xs text-blue-chalk"
const storyClasses =
  "flex max-w-[52rem] flex-col gap-4 border-l border-biloba-flower/25 pl-5"
const storyBodyClasses =
  "font-sans text-base leading-relaxed text-justify text-prelude"

export function AboutUs() {
  return (
    <section
      id="about-us"
      aria-labelledby="about-us-title"
    className={`${sectionClasses} scroll-mt-20`}
    >
      <SectionHeader
        className={headerWidthClasses}
        eyebrow="// about us"
        title={
          <span id="about-us-title">Here in AWS, it&apos;s always day one!</span>
        }
        subtitle={INTRO}
      />

      <div className={tagsClasses}>
        {CHAPTER_TAGS.map((tag) => (
          <span key={tag} className={tagClasses}>{tag}</span>
        ))}
      </div>

      <blockquote className={storyClasses}>
        <p className={storyBodyClasses}>
          It all began as a dream shared by eight students under the name{" "}
          <span className={emphasisClasses}>AWS Learning Club - España</span>.
          The spark was lit when the founder met the first Country Lead of AWS
          Cloud Clubs Philippines, an encounter that transformed a simple
          curiosity into a mission to establish a dedicated cloud community at
          UST. Knowing 2025 was their only window to gain university
          accreditation, the founder and seven co-founders pushed forward
          together — establishing the group in 2024 and securing official AWS
          and UST recognition as{" "}
          <span className={emphasisClasses}>AWS Cloud Club - UST</span> in 2025.
        </p>
        <p className={storyBodyClasses}>
          The core goal is clear: bridge the divide between what classes teach
          and actual real-world tech demands. Created to serve the entire CICS
          community, the club equips Thomasians with practical, hands-on
          workshops and direct connections to industry leaders and peer builders
          nationwide.
        </p>
      </blockquote>
    </section>
  )
}
