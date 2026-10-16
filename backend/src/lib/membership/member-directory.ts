import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applications,
  committees,
  membershipPaymentCampaigns,
  membershipPayments,
  officerSeats,
  positions,
} from "../../db/schema";
import { recruitmentYearInt } from "../applications/application-code";
import { reservedSeatMemberIds } from "../core/member-id";
import { isExecutiveOfficeCommittee } from "../apply/committee-office-groups";
import { memberPositionLabel } from "./member-position";

/** Where a member sits: officer or adviser, executive associate, committee staff, or a general member. */
export type MemberRole = "eb" | "director" | "adviser" | "ea" | "staff" | "general";

export type DirectoryMember = {
  memberId: string;
  fullName: string;
  birthday: string | null;
  gender: string | null;
  facebookUrl: string | null;
  studentNumber: string | null;
  section: string | null;
  role: MemberRole;
  position: string;
  committee: string | null;
  verifiedAt: string | null;
};

/** Everyone whose membership is verified and active for the current recruitment year. */
export async function listDirectoryMembers(): Promise<DirectoryMember[]> {
  const rows = await db
    .select({
      memberId: applications.memberId,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      studentNumber: applicants.studentNumber,
      birthday: applicants.birthday,
      gender: applicants.gender,
      facebookUrl: applicants.facebookUrl,
      section: applicants.section,
      applicationType: applications.applicationType,
      applicationStatus: applications.status,
      positionName: positions.name,
      committeeName: committees.name,
      officerTitle: officerSeats.title,
      officerKind: officerSeats.kind,
      officerCommittee: officerSeats.committee,
      verifiedAt: membershipPayments.verifiedAt,
    })
    .from(membershipPayments)
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .innerJoin(
      membershipPaymentCampaigns,
      eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
    )
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .leftJoin(committees, eq(positions.committeeId, committees.id))
    .leftJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(
      and(
        eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYearInt()),
        eq(membershipPayments.status, "verified"),
        eq(membershipPayments.membershipStatus, "active"),
        isNull(applications.archivedAt),
      ),
    )
    .orderBy(applications.memberId);

  const advisers = await listAdvisers();
  const members = rows.flatMap((row): DirectoryMember[] => {
    if (!row.memberId) return [];
    if (row.officerKind) {
      return [
        {
          memberId: row.memberId,
          fullName: `${row.firstName} ${row.lastName}`,
          birthday: row.birthday,
          gender: row.gender,
          facebookUrl: row.facebookUrl,
          studentNumber: row.studentNumber,
          section: row.section,
          role: row.officerKind,
          position: row.officerTitle ?? "Officer",
          committee: row.officerCommittee,
          verifiedAt: row.verifiedAt?.toISOString() ?? null,
        },
      ];
    }
    const position = memberPositionLabel(row);
    const inCommittee = position !== "General Member";
    const role: MemberRole = !inCommittee
      ? "general"
      : row.committeeName && isExecutiveOfficeCommittee(row.committeeName)
        ? "ea"
        : "staff";
    return [
      {
        memberId: row.memberId,
        fullName: `${row.firstName} ${row.lastName}`,
        birthday: row.birthday,
        gender: row.gender,
        facebookUrl: row.facebookUrl,
        studentNumber: row.studentNumber,
        section: row.section,
        role,
        position,
        committee: inCommittee ? row.committeeName : null,
        verifiedAt: row.verifiedAt?.toISOString() ?? null,
      },
    ];
  });
  return [...members, ...advisers].sort((a, b) => a.memberId.localeCompare(b.memberId));
}

/** Advisers hold an active Member ID without paying, so they have no payment row. */
async function listAdvisers(): Promise<DirectoryMember[]> {
  const rows = await db
    .select({
      memberId: applications.memberId,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      birthday: applicants.birthday,
      gender: applicants.gender,
      facebookUrl: applicants.facebookUrl,
      studentNumber: applicants.studentNumber,
      section: applicants.section,
      title: officerSeats.title,
      issuedAt: applications.submittedAt,
    })
    .from(officerSeats)
    .innerJoin(applications, eq(officerSeats.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(
      and(
        eq(officerSeats.kind, "adviser"),
        eq(officerSeats.recruitmentYear, recruitmentYearInt()),
        isNull(applications.archivedAt),
      ),
    );
  return rows.flatMap((row) =>
    row.memberId
      ? [
          {
            memberId: row.memberId,
            fullName: `${row.firstName} ${row.lastName}`,
            birthday: row.birthday,
            gender: row.gender,
            facebookUrl: row.facebookUrl,
            studentNumber: row.studentNumber,
            section: row.section,
            role: "adviser" as const,
            position: row.title,
            committee: null,
            verifiedAt: row.issuedAt.toISOString(),
          },
        ]
      : [],
  );
}

/** A board member or director who has not paid yet: listed with the number held for their seat. */
export type PendingOfficer = {
  fullName: string;
  birthday: string | null;
  gender: string | null;
  facebookUrl: string | null;
  position: string;
  role: "eb" | "director" | "ea";
  committee: string;
  /** Null for executive assistants: their number comes from their office's block when they pay. */
  reservedMemberId: string | null;
  applicationCode: string;
  studentNumber: string | null;
  section: string | null;
};

/** Board members, directors and executive assistants whose Member ID is not active yet. */
export async function listPendingOfficers(
  activeMemberIds: Set<string>,
): Promise<PendingOfficer[]> {
  const recruitmentYear = recruitmentYearInt();
  const rows = await db
    .select({
      kind: officerSeats.kind,
      committee: officerSeats.committee,
      title: officerSeats.title,
      sortOrder: officerSeats.sortOrder,
      memberId: applications.memberId,
      applicationCode: applications.applicationCode,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      birthday: applicants.birthday,
      gender: applicants.gender,
      facebookUrl: applicants.facebookUrl,
      studentNumber: applicants.studentNumber,
      section: applicants.section,
    })
    .from(officerSeats)
    .innerJoin(applications, eq(officerSeats.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(
      and(
        eq(officerSeats.recruitmentYear, recruitmentYear),
        isNull(applications.archivedAt),
      ),
    )
    .orderBy(officerSeats.kind, officerSeats.sortOrder);
  const pending = rows.flatMap((row) =>
    (row.kind === "eb" || row.kind === "director" || row.kind === "ea") &&
    row.committee &&
    !(row.memberId && activeMemberIds.has(row.memberId))
      ? [{ ...row, kind: row.kind, committee: row.committee }]
      : [],
  );
  const numbered = pending.filter((row) => row.kind !== "ea");
  const reserved = await reservedSeatMemberIds(
    db,
    recruitmentYear,
    numbered.map((row) =>
      row.kind === "eb"
        ? { kind: "eb" as const, officeCommittee: row.committee }
        : { kind: "director" as const, committee: row.committee },
    ),
  );
  const reservedByRow = new Map(numbered.map((row, index) => [row, reserved[index]]));
  return pending.map((row) => ({
    fullName: `${row.firstName} ${row.lastName}`,
    birthday: row.birthday,
    gender: row.gender,
    facebookUrl: row.facebookUrl,
    position: row.title,
    role: row.kind,
    committee: row.committee,
    reservedMemberId: reservedByRow.get(row) ?? null,
    applicationCode: row.applicationCode,
    studentNumber: row.studentNumber,
    section: row.section,
  }));
}
