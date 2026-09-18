import Image from "next/image"
import { SectionHeader } from "@/components/shared/section-header"
import { QuizGate } from "@/components/quiz/gate"
import { landingCommitteeCardOrder } from "@/lib/apply/committee-groups"
import { cn } from "@/lib/utils"

type CommitteeCard = readonly [category: string, title: string, description: string]

const committeesByTitle: Record<string, CommitteeCard> = {
  Sponsorships: [
    "PARTNERSHIPS",
    "Sponsorships",
    "Sources and secures sponsors, prepares proposals, negotiates terms, and manages sponsorship deliverables for the organization.",
  ],
  "External Affairs": [
    "External Relations",
    "External Affairs",
    "Acts as the liaison between the members and the external partners of the organization.",
  ],
  Marketing: [
    "Marketing",
    "Marketing",
    "Develops and implements comprehensive marketing plans and campaigns for events, while managing relationships with partners, sponsors, and the public.",
  ],
  Logistics: [
    "Operations",
    "Logistics",
    "Plans and executes event production, including venue, equipment, and manpower needs.",
  ],
  Secretariat: [
    "Administration",
    "Secretariat",
    "Handles the internal and organizational matters of the organization, including feedback mechanisms for events, meetings, or activities.",
  ],
  Finance: [
    "Financing",
    "Finance",
    "Manages and facilitates the flow of financial resources for events, and continuously develops initiatives to guarantee sustainable and consistent funding.",
  ],
  "Community Development": [
    "Community",
    "Community Development",
    "Plans outreach programs with partner communities of the UST Simbahayan Community Development Office, while promoting social consciousness among members.",
  ],
  "Human Resources": [
    "People",
    "Human Resources",
    "Manages the members within the organization, including their welfare, satisfaction, and involvement in the organization’s events, meetings, and activities.",
  ],
  Technical: [
    "Technology",
    "Technical",
    "Oversees and coordinates the technical aspects of every event, meeting, or activity the organization holds.",
  ],
  Media: [
    "Creatives",
    "Media",
    "Produces edits of all video and multimedia production for events, meetings, and promotional purposes of the organization.",
  ],
  Publication: [
    "Creatives",
    "Publication",
    "Designs graphic advertisements, publications, and promotional materials for the organization’s social media accounts.",
  ],
  Documentation: [
    "Creatives",
    "Documentation",
    "Documents the projects and activities of the organization for whatever official record it may be used.",
  ],
  Development: [
    "Technology",
    "Development",
    "Creates and produces online resources for organization use, and educates members on how to utilize them effectively.",
  ],
}

const committees: CommitteeCard[] = landingCommitteeCardOrder().map(
  (title) => committeesByTitle[title],
)
const committeeIcons: Record<string, string> = {
  "Executive (Internal)": "executive-internal.png",
  Sponsorships: "executive-internal.png",
  "External Affairs": "external-affairs.png",
  Marketing: "marketing.png",
  Logistics: "logistics.png",
  Secretariat: "secretariat.png",
  Finance: "finance.png",
  "Community Development": "community-development.png",
  "Human Resources": "human-resources.png",
  Technical: "technical.png",
  Media: "media.png",
  Publication: "publication.png",
  Documentation: "documentation.png",
  Development: "development.png",
}

const sectionClasses =
  "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)] pt-[clamp(3rem,7vw,5.625rem)]"
const cardsClasses =
  "grid auto-rows-fr grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
const cardClasses =
  "flex h-full min-h-[15rem] flex-col rounded-[14px] border border-biloba-flower/15 bg-daisy-bush/25 p-4 transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-biloba-flower/35 hover:bg-daisy-bush/35 hover:shadow-[0_0_24px_rgba(183,140,240,0.18)] motion-reduce:transition-none motion-reduce:hover:transform-none sm:min-h-[16rem] sm:p-5 lg:p-6"
const iconClasses =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-biloba-flower/25 bg-haiti/60 shadow-[0_0_20px_rgba(183,140,240,0.24)]"
const categoryClasses =
  "font-mono text-[0.65rem] uppercase tracking-[0.1em] text-prelude sm:text-xs"
const titleClasses =
  "mt-2 flex items-center gap-3 text-lg font-semibold leading-tight text-blue-chalk sm:text-xl"
const descriptionClasses = "mt-2.5 text-sm leading-[1.4] text-prelude"

export function Committees() {
  return (
    <section
      id="committees"
      aria-labelledby="committees-title"
      className={`${sectionClasses} scroll-mt-20`}
    >
      <SectionHeader
        eyebrow="// committees"
        title={<span id="committees-title">Thirteen committees. One community.</span>}
        subtitle="Every member lands on a committee that fits how they like to build, organize, or create."
      />

      <div className={cardsClasses}>
        {committees.map(([category, title, description], index) => (
          <article
            key={title}
            className={cn(
              cardClasses,
              index === committees.length - 1 &&
                "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.625rem)] lg:col-span-1 lg:mx-0 lg:w-auto lg:col-start-2",
            )}
          >
            <p className={categoryClasses}>{category}</p>
            <h3 className={titleClasses}>
              <span className={iconClasses}>
                <Image
                  src={"/committees/" + committeeIcons[title]}
                  alt=""
                  width={48}
                  height={48}
                  className={
                    title === "Sponsorships" || title === "External Affairs"
                      ? "h-10 w-10 object-contain"
                      : "h-8 w-8 object-contain"
                  }
                  draggable={false}
                />
              </span>
              {title}
            </h3>
            <p className={descriptionClasses}>{description}</p>
          </article>
        ))}
      </div>

      <QuizGate />
    </section>
  )
}
