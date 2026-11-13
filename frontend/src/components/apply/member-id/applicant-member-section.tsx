"use client"

import { ApplicantSection } from "@/components/apply/dashboard/applicant-section"
import { MemberIdCard } from "@/components/apply/member-id/member-id-card"
import type { ApplicantApplication, MemberCard } from "@/lib/api/applicant"
import { validThroughLabel } from "@/lib/members/id-card"

// Block-level, so the card's max-w-full measures the panel, not itself.
const cardAreaClasses = "min-w-0 py-2"

type MemberSectionProps = {
  card: MemberCard
  application: Pick<ApplicantApplication, "firstName" | "lastName" | "studentNumber" | "section">
  onCardChange: (card: MemberCard) => void
  milestone: boolean
}

export function ApplicantMemberSection({ card, application, onCardChange, milestone }: MemberSectionProps) {
  return (
    <ApplicantSection
      area="MEMBERSHIP"
      titleId="member-id-title"
      title="Official Digital Membership ID"
      status={`Member ID ${card.memberId} · valid through ${validThroughLabel(card.recruitmentYear)}`}
      milestone={milestone}
    >
      <div className={cardAreaClasses}>
        <MemberIdCard
          card={card}
          firstName={application.firstName}
          lastName={application.lastName}
          studentNumber={application.studentNumber}
          section={application.section}
          onCardChange={onCardChange}
        />
      </div>
    </ApplicantSection>
  )
}
