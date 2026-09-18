import { SectionHeader } from "@/components/shared/section-header"

const CONTACT_CHANNELS = [
  {
    label: "General inquiries",
    description:
      "Questions about AWS Builders – UST, membership, events, or how to get involved.",
    email: "aws.cics@ust.edu.ph",
  },
  {
    label: "Sponsorships",
    description:
      "Reach out about sponsoring our programs, events, or initiatives.",
    email: "sponsorships.awsust@gmail.com",
  },
  {
    label: "Partnerships",
    description:
      "Collaborations with student orgs, schools, companies, or community groups.",
    email: "partnerships.awsust@gmail.com",
  },
] as const

const sectionClasses =
  "flex w-full flex-col gap-[clamp(2rem,4vw,3.5rem)] scroll-mt-20"
const headerWidthClasses = "[&>h2]:max-w-[46rem] [&>p:last-child]:max-w-[60rem]"
const cardListClasses = "grid gap-4 md:grid-cols-3"
const cardClasses =
  "glass flex h-full min-h-[10rem] flex-col gap-4 rounded-[28px] border border-biloba-flower/25 bg-meteorite/55 p-5"
const cardTitleClasses = "font-sans text-lg font-bold text-blue-chalk"
const cardDescriptionClasses = "font-sans text-sm leading-relaxed text-prelude"
const emailLinkClasses =
  "mt-auto font-mono text-sm text-aquamarine underline-offset-4 transition-colors hover:text-blue-chalk hover:underline"

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className={sectionClasses}
    >
      <SectionHeader
        className={headerWidthClasses}
        eyebrow="// contact"
        title={<span id="contact-title">Get in touch.</span>}
        subtitle="Whether you are a Thomasian curious about the org, a brand exploring sponsorship, or a group looking to partner with us — email the right channel and we will get back to you."
      />

      <div className={cardListClasses}>
        {CONTACT_CHANNELS.map((channel) => (
          <article key={channel.email} className={cardClasses}>
            <div className="flex flex-col gap-2">
              <h3 className={cardTitleClasses}>{channel.label}</h3>
              <p className={cardDescriptionClasses}>{channel.description}</p>
            </div>
            <a
              href={`mailto:${channel.email}`}
              className={emailLinkClasses}
            >
              {channel.email}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
