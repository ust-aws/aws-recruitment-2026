import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  check,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["hr", "admin"]);
export const applicationStatus = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);
export const documentType = pgEnum("document_type", ["resume", "transcript"]);

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
    section: varchar({ length: 50 }),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique().on(t.committeeId, t.name),
    index("idx_positions_committee").on(t.committeeId),
    index("idx_positions_open").on(t.isOpen),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => applicants.id, { onDelete: "cascade" }),
    status: applicationStatus().notNull().default("pending"),
    // Apply-form "Why do you want to join AWS Builders - UST?" — on the application, not the applicant.
    // default("") is for drizzle-kit push against existing rows; seed and POST always send a real answer.
    motivation: text().notNull().default(""),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_applications_applicant").on(t.applicantId),
    index("idx_applications_status").on(t.status),
    index("idx_applications_submitted_at").on(t.submittedAt),
    index("idx_applications_reviewed_by").on(t.reviewedBy),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "application_choices_preference_rank_check",
      sql`${t.preferenceRank} IN (1, 2)`,
    ),
    unique().on(t.applicationId, t.preferenceRank),
    unique().on(t.applicationId, t.positionId),
    index("idx_application_choices_application").on(t.applicationId),
    index("idx_application_choices_position").on(t.positionId),
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
    s3Key: text("s3_key").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.applicationId, t.documentType),
    index("idx_documents_application").on(t.applicationId),
  ],
);
