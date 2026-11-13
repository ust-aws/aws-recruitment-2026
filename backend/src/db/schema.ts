import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  check,
  unique,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["hr", "admin", "finance"]);
export const applicationStatus = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);
export const applicationType = pgEnum("application_type", [
  "position",
  "member",
  "officer",
]);
export const officerKind = pgEnum("officer_kind", ["eb", "director", "ea", "adviser"]);
/** Which recruitment round an application or position belongs to: R101, or the officer hunt. */
export const recruitmentTrack = pgEnum("recruitment_track", ["r101", "officer_hunt"]);
export const applicationChoiceStatus = pgEnum("application_choice_status", [
  "pending",
  "approved",
  "rejected",
]);
export const redirectResponseStatus = pgEnum("redirect_response_status", [
  "accepted",
  "declined",
]);
export const documentType = pgEnum("document_type", [
  "resume",
  "transcript",
  "registration",
]);
export const uploadSessionStatus = pgEnum("upload_session_status", [
  "active",
  "consumed",
  "expired",
]);
export const emailMessageType = pgEnum("email_message_type", [
  "application_submitted",
  "applicant_otp",
  "interview_booking",
  "interview_reminder_24h",
  "interview_reminder_1h",
  "officer_application_notice",
  "officer_first_choice_left",
  "officer_first_choice_joined",
  "officer_interview_rescheduled",
  "applicant_dev_exam",
  "member_registration",
  "result_accepted",
  "result_rejected",
  "result_redirected",
  "payment_invitation",
  // Legacy: no longer sent. Postgres cannot drop an enum value, so it stays.
  "membership_confirmation",
  "membership_verified",
  "officer_welcome",
  "payment_deadline_extended",
  "payment_resubmission_needed",
]);
export const emailDeliveryStatus = pgEnum("email_delivery_status", [
  "pending",
  "sending",
  "sent",
  "failed",
]);
export const applicantGender = pgEnum("applicant_gender", ["male", "female"]);
export const membershipPaymentStatus = pgEnum("membership_payment_status", [
  "awaiting_payment",
  "pending_verification",
  "verified",
  "needs_resubmission",
  "expired",
]);
export const membershipStatus = pgEnum("membership_status", [
  "inactive",
  "active",
  "revoked",
]);
export const membershipConfirmationStatus = pgEnum(
  "membership_confirmation_status",
  ["not_released", "released", "email_failed"],
);
export const paymentMethod = pgEnum("payment_method", ["gcash", "bpi"]);
export const paymentSubmissionStatus = pgEnum("payment_submission_status", [
  "pending",
  "verified",
  "rejected",
  "reversed",
]);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    role: userRole().notNull().default("hr"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_users_email").on(t.email)],
);

export const applicants = pgTable(
  "applicants",
  {
    id: uuid().primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    age: integer(),
    birthday: date("birthday"),
    gender: applicantGender("gender"),
    section: varchar({ length: 50 }),
    studentNumber: varchar("student_number", { length: 10 }),
    contactNumber: varchar("contact_number", { length: 14 }),
    facebookUrl: text("facebook_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("applicants_age_check", sql`${t.age} > 0`),
    index("idx_applicants_email").on(t.email),
    index("idx_applicants_name").on(t.lastName, t.firstName),
    index("idx_applicants_section").on(t.section),
  ],
);

export const committees = pgTable("committees", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  acceptingApplications: boolean("accepting_applications")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const positions = pgTable(
  "positions",
  {
    id: uuid().primaryKey().defaultRandom(),
    committeeId: uuid("committee_id")
      .notNull()
      .references(() => committees.id, { onDelete: "cascade" }),
    name: varchar({ length: 150 }).notNull(),
    office: varchar({ length: 150 }),
    description: text(),
    responsibilities: text(),
    isOpen: boolean("is_open").notNull().default(true),
    openSlots: integer("open_slots").notNull().default(4),
    /** R101 positions or officer-hunt seats; they share committees but never an apply form. */
    track: recruitmentTrack().notNull().default("r101"),
    /** What an accepted officer-hunt applicant becomes; null for R101 positions. */
    seatKind: officerKind("seat_kind"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("positions_committee_name_track_unique").on(t.committeeId, t.name, t.track),
    index("idx_positions_committee").on(t.committeeId),
    index("idx_positions_open").on(t.isOpen),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationCode: varchar("application_code", { length: 24 })
      .notNull()
      .unique()
      .default(
        sql`'AP-' || extract(year from current_date)::text || '-' || lpad((floor(random() * 1000000))::text, 6, '0')`,
      ),
    recruitmentYear: integer("recruitment_year")
      .notNull()
      .default(sql`extract(year from current_date)::integer`),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => applicants.id, { onDelete: "cascade" }),
    status: applicationStatus().notNull().default("pending"),
    applicationType: applicationType("application_type")
      .notNull()
      .default("position"),
    track: recruitmentTrack().notNull().default("r101"),
    // Apply-form "Why do you want to join AWS Builders - UST?" — on the application, not the applicant.
    // default("") is for drizzle-kit push against existing rows; seed and POST always send a real answer.
    motivation: text().notNull().default(""),
    dataPrivacyAgreedAt: timestamp("data_privacy_agreed_at", {
      withTimezone: true,
    }),
    portfolioUrl: text("portfolio_url"),
    githubUrl: text("github_url"),
    finalPositionId: uuid("final_position_id").references(() => positions.id, {
      onDelete: "restrict",
    }),
    redirectPositionId: uuid("redirect_position_id").references(
      () => positions.id,
      { onDelete: "restrict" },
    ),
    redirectResponse: redirectResponseStatus("redirect_response"),
    redirectRespondedAt: timestamp("redirect_responded_at", {
      withTimezone: true,
    }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    resultsReleasedAt: timestamp("results_released_at", {
      withTimezone: true,
    }),
    resultsReleasedBy: uuid("results_released_by").references(() => users.id, {
      onDelete: "set null",
    }),
    memberId: varchar("member_id", { length: 32 }).unique(),
    memberPhotoKey: text("member_photo_key"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    archivedBy: uuid("archived_by").references(() => users.id, {
      onDelete: "set null",
    }),
    archiveReason: text("archive_reason"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "applications_application_code_format_check",
      sql`${t.applicationCode} ~ '^AP-[0-9]{4}-[0-9]{6}$'`,
    ),
    check(
      "applications_application_code_year_check",
      sql`substring(${t.applicationCode} from 4 for 4) = ${t.recruitmentYear}::text`,
    ),
    check(
      "applications_recruitment_year_check",
      sql`${t.recruitmentYear} BETWEEN 2000 AND 9999`,
    ),
    check(
      "applications_results_release_audit_check",
      sql`${t.resultsReleasedBy} IS NULL OR ${t.resultsReleasedAt} IS NOT NULL`,
    ),
    check(
      "applications_archive_audit_check",
      sql`(${t.archivedBy} IS NULL AND ${t.archiveReason} IS NULL) OR ${t.archivedAt} IS NOT NULL`,
    ),
    check(
      "applications_member_id_not_blank_check",
      sql`${t.memberId} IS NULL OR length(trim(${t.memberId})) > 0`,
    ),
    check(
      "applications_redirect_response_audit_check",
      sql`${t.redirectResponse} IS NULL OR ${t.redirectRespondedAt} IS NOT NULL`,
    ),
    check(
      "applications_redirect_response_requires_offer_check",
      sql`${t.redirectResponse} IS NULL OR ${t.redirectPositionId} IS NOT NULL`,
    ),
    unique("applications_applicant_year_track_unique").on(
      t.applicantId,
      t.recruitmentYear,
      t.track,
    ),
    index("idx_applications_track").on(t.track),
    index("idx_applications_applicant").on(t.applicantId),
    index("idx_applications_status").on(t.status),
    index("idx_applications_type").on(t.applicationType),
    index("idx_applications_recruitment_year").on(t.recruitmentYear),
    index("idx_applications_final_position").on(t.finalPositionId),
    index("idx_applications_results_released_at").on(t.resultsReleasedAt),
    index("idx_applications_archived_at").on(t.archivedAt),
    index("idx_applications_submitted_at").on(t.submittedAt),
    index("idx_applications_reviewed_by").on(t.reviewedBy),
    index("idx_applications_code").on(t.applicationCode),
  ],
);

/**
 * Elected officers and advisers. Each one has an `officer` application so they
 * sign in, pay and get a Member ID like any member, but they never take part
 * in recruitment. `seatKey` is the office or committee name (or `adviser-<n>`).
 */
export const officerSeats = pgTable(
  "officer_seats",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .unique()
      .references(() => applications.id, { onDelete: "cascade" }),
    recruitmentYear: integer("recruitment_year").notNull(),
    kind: officerKind().notNull(),
    seatKey: varchar("seat_key", { length: 150 }).notNull(),
    title: varchar({ length: 150 }).notNull(),
    committee: varchar({ length: 150 }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.recruitmentYear, t.seatKey)],
);

export const emailNotifications = pgTable(
  "email_notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "cascade",
    }),
    messageType: emailMessageType("message_type").notNull(),
    recipient: varchar({ length: 255 }).notNull(),
    status: emailDeliveryStatus().notNull().default("pending"),
    attempts: integer().notNull().default(0),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    /** When a queued email is next due; null means due now. */
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    /** When a worker moved the row to "sending". */
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_email_notifications_application").on(t.applicationId),
    index("idx_email_notifications_status_created").on(t.status, t.createdAt),
    index("idx_email_notifications_status_next_attempt").on(
      t.status,
      t.nextAttemptAt,
    ),
  ],
);

/**
 * Single-row lease so only one email outbox worker sends at a time; two
 * workers would double the send rate and trip Gmail's per-user limit.
 */
export const emailOutboxLease = pgTable("email_outbox_lease", {
  id: integer().primaryKey(),
  holder: text().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const applicantOtpChallenges = pgTable(
  "applicant_otp_challenges",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: integer().notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "applicant_otp_challenges_code_hash_check",
      sql`${t.codeHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "applicant_otp_challenges_attempts_check",
      sql`${t.attempts} BETWEEN 0 AND 5`,
    ),
    check(
      "applicant_otp_challenges_expiry_check",
      sql`${t.expiresAt} > ${t.createdAt}`,
    ),
    check(
      "applicant_otp_challenges_consumed_at_check",
      sql`${t.consumedAt} IS NULL OR ${t.consumedAt} >= ${t.createdAt}`,
    ),
    index("idx_applicant_otp_application_created").on(
      t.applicationId,
      t.createdAt,
    ),
    index("idx_applicant_otp_expires_at").on(t.expiresAt),
  ],
);

export const applicationChoices = pgTable(
  "application_choices",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "restrict" }),
    preferenceRank: integer("preference_rank").notNull(),
    decisionStatus: applicationChoiceStatus("decision_status")
      .notNull()
      .default("pending"),
    decidedBy: uuid("decided_by").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "application_choices_preference_rank_check",
      sql`${t.preferenceRank} IN (1, 2)`,
    ),
    check(
      "application_choices_decision_audit_check",
      sql`(${t.decisionStatus} = 'pending' AND ${t.decidedAt} IS NULL AND ${t.decidedBy} IS NULL) OR (${t.decisionStatus} IN ('approved', 'rejected') AND ${t.decidedAt} IS NOT NULL)`,
    ),
    unique().on(t.applicationId, t.preferenceRank),
    unique().on(t.applicationId, t.positionId),
    index("idx_application_choices_application").on(t.applicationId),
    index("idx_application_choices_position").on(t.positionId),
    index("idx_application_choices_decision_status").on(t.decisionStatus),
    index("idx_application_choices_decided_by").on(t.decidedBy),
  ],
);

export const interviewSlots = pgTable(
  "interview_slots",
  {
    id: uuid().primaryKey().defaultRandom(),
    committeeId: uuid("committee_id")
      .notNull()
      .references(() => committees.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    isOpen: boolean("is_open").notNull().default(true),
    track: recruitmentTrack().notNull().default("r101"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "interview_slots_half_hour_alignment_check",
      sql`extract(minute from ${t.startsAt}) IN (0, 30) AND extract(second from ${t.startsAt}) = 0`,
    ),
    unique("interview_slots_committee_starts_at_unique").on(
      t.committeeId,
      t.startsAt,
    ),
    index("idx_interview_slots_committee_starts_at").on(
      t.committeeId,
      t.startsAt,
    ),
    index("idx_interview_slots_open_starts_at").on(t.isOpen, t.startsAt),
  ],
);

export const interviewBookings = pgTable(
  "interview_bookings",
  {
    id: uuid().primaryKey().defaultRandom(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => interviewSlots.id, { onDelete: "restrict" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    bookedAt: timestamp("booked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reminder24hSentAt: timestamp("reminder_24h_sent_at", {
      withTimezone: true,
    }),
    reminder1hSentAt: timestamp("reminder_1h_sent_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("interview_bookings_slot_unique").on(t.slotId),
    unique("interview_bookings_application_unique").on(t.applicationId),
    index("idx_interview_bookings_application").on(t.applicationId),
  ],
);

export const interviewWindows = pgTable(
  "interview_windows",
  {
    id: uuid().primaryKey().defaultRandom(),
    singleton: integer().notNull().default(1),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("interview_windows_singleton_unique").on(t.singleton),
    check("interview_windows_singleton_check", sql`${t.singleton} = 1`),
    check(
      "interview_windows_range_check",
      sql`${t.endsAt} > ${t.startsAt}`,
    ),
  ],
);

export const recruitmentWindows = pgTable(
  "recruitment_windows",
  {
    id: uuid().primaryKey().defaultRandom(),
    singleton: integer().notNull().default(1),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("recruitment_windows_singleton_unique").on(t.singleton),
    check("recruitment_windows_singleton_check", sql`${t.singleton} = 1`),
    check(
      "recruitment_windows_range_check",
      sql`${t.endsAt} > ${t.startsAt}`,
    ),
  ],
);

/**
 * The officer hunt's own calendar: which term it fills, when people may apply
 * and when interviews run. One row, like the R101 windows.
 */
export const officerHuntSettings = pgTable(
  "officer_hunt_settings",
  {
    id: uuid().primaryKey().defaultRandom(),
    singleton: integer().notNull().default(1),
    /** The term the winners serve; it is their applications' `recruitment_year`. */
    termYear: integer("term_year").notNull(),
    applicationsOpenAt: timestamp("applications_open_at", { withTimezone: true }),
    applicationsCloseAt: timestamp("applications_close_at", { withTimezone: true }),
    interviewsStartAt: timestamp("interviews_start_at", { withTimezone: true }),
    interviewsEndAt: timestamp("interviews_end_at", { withTimezone: true }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("officer_hunt_settings_singleton_unique").on(t.singleton),
    check("officer_hunt_settings_singleton_check", sql`${t.singleton} = 1`),
    check(
      "officer_hunt_settings_term_year_check",
      sql`${t.termYear} BETWEEN 2000 AND 9999`,
    ),
  ],
);

export const membershipPaymentCampaigns = pgTable(
  "membership_payment_campaigns",
  {
    id: uuid().primaryKey().defaultRandom(),
    recruitmentYear: integer("recruitment_year").notNull().unique(),
    amountCents: integer("amount_cents"),
    opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
    isOpen: boolean("is_open").notNull().default(false),
    gcashAccountName: varchar("gcash_account_name", { length: 150 }),
    gcashAccountNumber: varchar("gcash_account_number", { length: 50 }),
    gcashQrImageUrl: text("gcash_qr_image_url"),
    gcashQrImageKey: text("gcash_qr_image_key"),
    gcashQrFileName: text("gcash_qr_file_name"),
    /** CFO's GCash QR, used by everyone accepted into a committee (EAs and staff). */
    gcashCoreQrImageKey: text("gcash_core_qr_image_key"),
    gcashCoreQrFileName: text("gcash_core_qr_file_name"),
    bpiAccountName: varchar("bpi_account_name", { length: 150 }),
    bpiAccountNumber: varchar("bpi_account_number", { length: 50 }),
    bpiQrImageUrl: text("bpi_qr_image_url"),
    bpiQrImageKey: text("bpi_qr_image_key"),
    bpiQrFileName: text("bpi_qr_file_name"),
    generalChatLink: text("general_chat_link"),
    coreTeamChatLink: text("core_team_chat_link"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    openedBy: uuid("opened_by").references(() => users.id, {
      onDelete: "set null",
    }),
    confirmationsReleasedAt: timestamp("confirmations_released_at", {
      withTimezone: true,
    }),
    confirmationsReleasedBy: uuid("confirmations_released_by").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "membership_payment_campaigns_year_check",
      sql`${t.recruitmentYear} BETWEEN 2000 AND 9999`,
    ),
    check(
      "membership_payment_campaigns_amount_check",
      sql`${t.amountCents} IS NULL OR ${t.amountCents} > 0`,
    ),
    check(
      "membership_payment_campaigns_range_check",
      sql`${t.deadlineAt} > ${t.opensAt}`,
    ),
    check(
      "membership_payment_campaigns_open_audit_check",
      sql`${t.openedBy} IS NULL OR ${t.openedAt} IS NOT NULL`,
    ),
    check(
      "membership_payment_campaigns_release_audit_check",
      sql`${t.confirmationsReleasedBy} IS NULL OR ${t.confirmationsReleasedAt} IS NOT NULL`,
    ),
    index("idx_membership_payment_campaigns_open").on(t.isOpen, t.deadlineAt),
  ],
);

export const membershipPaymentChatLinks = pgTable(
  "membership_payment_chat_links",
  {
    id: uuid().primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => membershipPaymentCampaigns.id, { onDelete: "cascade" }),
    committeeId: uuid("committee_id")
      .notNull()
      .references(() => committees.id, { onDelete: "cascade" }),
    chatLink: text("chat_link").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("membership_payment_chat_links_campaign_committee_unique").on(
      t.campaignId,
      t.committeeId,
    ),
    check(
      "membership_payment_chat_links_not_blank_check",
      sql`length(trim(${t.chatLink})) > 0`,
    ),
  ],
);

export const membershipPayments = pgTable(
  "membership_payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => membershipPaymentCampaigns.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" })
      .unique(),
    status: membershipPaymentStatus().notNull().default("awaiting_payment"),
    membershipStatus: membershipStatus("membership_status")
      .notNull()
      .default("inactive"),
    confirmationStatus: membershipConfirmationStatus("confirmation_status")
      .notNull()
      .default("not_released"),
    resubmissionDeadlineAt: timestamp("resubmission_deadline_at", {
      withTimezone: true,
    }),
    /** HR let this person pay late, quietly: they may pay until then even after the period closes. */
    personalDeadlineAt: timestamp("personal_deadline_at", {
      withTimezone: true,
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversedBy: uuid("reversed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reversalReason: text("reversal_reason"),
    confirmationReleasedAt: timestamp("confirmation_released_at", {
      withTimezone: true,
    }),
    confirmationReleasedBy: uuid("confirmation_released_by").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    assignedChatLink: text("assigned_chat_link"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("membership_payments_campaign_application_unique").on(
      t.campaignId,
      t.applicationId,
    ),
    check(
      "membership_payments_verification_audit_check",
      sql`${t.verifiedBy} IS NULL OR ${t.verifiedAt} IS NOT NULL`,
    ),
    check(
      "membership_payments_reversal_audit_check",
      sql`(${t.reversedBy} IS NULL AND ${t.reversalReason} IS NULL) OR ${t.reversedAt} IS NOT NULL`,
    ),
    check(
      "membership_payments_confirmation_audit_check",
      sql`${t.confirmationReleasedBy} IS NULL OR ${t.confirmationReleasedAt} IS NOT NULL`,
    ),
    index("idx_membership_payments_campaign_status").on(t.campaignId, t.status),
    index("idx_membership_payments_membership_status").on(t.membershipStatus),
    index("idx_membership_payments_confirmation_status").on(t.confirmationStatus),
  ],
);

export const membershipPaymentSubmissions = pgTable(
  "membership_payment_submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => membershipPayments.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => membershipPaymentCampaigns.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    method: paymentMethod().notNull(),
    referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
    referenceNumberNormalized: varchar("reference_number_normalized", {
      length: 100,
    }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    /** Google Drive link to the receipt. Older submissions used an uploaded file instead. */
    receiptUrl: text("receipt_url"),
    receiptKey: text("receipt_key"),
    receiptFileName: varchar("receipt_file_name", { length: 255 }),
    receiptMimeType: varchar("receipt_mime_type", { length: 50 }),
    receiptSizeBytes: integer("receipt_size_bytes"),
    receiptChecksumSha256: varchar("receipt_checksum_sha256", {
      length: 44,
    }),
    status: paymentSubmissionStatus().notNull().default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewReason: text("review_reason"),
  },
  (t) => [
    unique("membership_payment_submissions_payment_attempt_unique").on(
      t.paymentId,
      t.attemptNumber,
    ),
    // Rejected/reversed attempts free their reference so the same applicant can resubmit a valid one.
    uniqueIndex("membership_payment_submissions_reference_unique")
      .on(t.campaignId, t.referenceNumberNormalized)
      .where(sql`${t.status} NOT IN ('rejected', 'reversed')`),
    check(
      "membership_payment_submissions_attempt_check",
      sql`${t.attemptNumber} > 0`,
    ),
    check(
      "membership_payment_submissions_amount_check",
      sql`${t.amountCents} > 0`,
    ),
    check(
      "membership_payment_submissions_size_check",
      sql`${t.receiptSizeBytes} > 0 AND ${t.receiptSizeBytes} <= 10000000`,
    ),
    check(
      "membership_payment_submissions_reference_not_blank_check",
      sql`length(trim(${t.referenceNumberNormalized})) > 0`,
    ),
    check(
      "membership_payment_submissions_review_audit_check",
      sql`${t.reviewedBy} IS NULL OR ${t.reviewedAt} IS NOT NULL`,
    ),
    index("idx_membership_payment_submissions_payment").on(
      t.paymentId,
      t.submittedAt,
    ),
    index("idx_membership_payment_submissions_status").on(t.status),
  ],
);

export const applicationDocuments = pgTable(
  "application_documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    documentType: documentType("document_type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull().default(0),
    s3Key: text("s3_key").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    availableUntil: timestamp("available_until", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.applicationId, t.documentType),
    index("idx_documents_application").on(t.applicationId),
  ],
);

export const uploadSessions = pgTable(
  "upload_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    status: uploadSessionStatus().notNull().default("active"),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    resumeFileName: varchar("resume_file_name", { length: 255 }),
    resumeSizeBytes: integer("resume_size_bytes"),
    resumeChecksumSha256: varchar("resume_checksum_sha256", {
      length: 44,
    }),
    registrationFileName: varchar("registration_file_name", {
      length: 255,
    }),
    registrationSizeBytes: integer("registration_size_bytes"),
    registrationChecksumSha256: varchar("registration_checksum_sha256", {
      length: 44,
    }),
    uploadExpiresAt: timestamp("upload_expires_at", {
      withTimezone: true,
    }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_upload_sessions_status").on(t.status),
    index("idx_upload_sessions_expires_at").on(t.expiresAt),
    index("idx_upload_sessions_application").on(t.applicationId),
  ],
);
