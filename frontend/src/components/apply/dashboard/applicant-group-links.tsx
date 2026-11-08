import type { ReactNode } from "react"
import { ArrowUpRight, Crown, MessagesSquare, UsersRound } from "lucide-react"
import { ApplicantSection } from "@/components/apply/dashboard/applicant-section"

// Join links as ruled rows: icon, group, who is in it, and an outbound arrow.
const listClasses = "-mx-2 flex flex-col"
const linkClasses =
  "group flex min-w-0 items-center gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-blue-chalk/5 focus-visible:ring-2 focus-visible:ring-aquamarine/50 pointer-coarse:min-h-14"
const iconClasses =
  "grid size-9 shrink-0 place-items-center rounded-full border border-blue-chalk/15 bg-jacarta/60 text-prelude transition-colors group-hover:text-blue-chalk"
const textClasses = "min-w-0 flex-1"
const titleClasses = "block font-sans text-sm font-semibold text-pretty text-blue-chalk"
const subtitleClasses = "block font-sans text-xs text-prelude"
const arrowClasses =
  "size-4 shrink-0 text-prelude transition-[color,translate] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-aquamarine motion-reduce:transition-none"

export type ApplicantGroupLinksProps = {
  membersGroupLink: string | null
  committeeChatLink: string | null
  committeeName: string | null
  coreTeamChatLink?: string | null
}

function GroupLink({ href, icon, title, subtitle }: { href: string; icon: ReactNode; title: string; subtitle: string }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noreferrer" className={linkClasses}>
        <span className={iconClasses} aria-hidden>
          {icon}
        </span>
        <span className={textClasses}>
          <span className={titleClasses}>{title}</span>
          <span className={subtitleClasses}>{subtitle}</span>
        </span>
        <ArrowUpRight className={arrowClasses} aria-hidden />
      </a>
    </li>
  )
}

/** Join links for the Members Facebook Group, the committee group chat and, for EAs, the core team chat. */
export function ApplicantGroupLinks({
  membersGroupLink,
  committeeChatLink,
  committeeName,
  coreTeamChatLink,
}: ApplicantGroupLinksProps) {
  if (!membersGroupLink && !committeeChatLink && !coreTeamChatLink) return null
  return (
    <ApplicantSection
      area="GROUPS"
      titleId="applicant-groups-title"
      title="Join your AWS Builders groups"
      status="Stay updated with announcements and meet your fellow Builders."
    >
      <ul className={listClasses}>
        {committeeChatLink ? (
          <GroupLink
            href={committeeChatLink}
            icon={<MessagesSquare className="size-4" />}
            title={`${committeeName ?? "Committee"} Group Chat`}
            subtitle="Join your committee"
          />
        ) : null}
        {coreTeamChatLink ? (
          <GroupLink
            href={coreTeamChatLink}
            icon={<Crown className="size-4" />}
            title="Core Team Group Chat"
            subtitle="Join the EB, EAs and Directors"
          />
        ) : null}
        {membersGroupLink ? (
          <GroupLink
            href={membersGroupLink}
            icon={<UsersRound className="size-4" />}
            title="Members Facebook Group"
            subtitle="Join all AWS Builders members"
          />
        ) : null}
      </ul>
    </ApplicantSection>
  )
}
