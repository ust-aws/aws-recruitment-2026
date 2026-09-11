import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

await sql`
  CREATE TABLE IF NOT EXISTS interview_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE cascade,
    starts_at timestamptz NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT interview_slots_half_hour_alignment_check
      CHECK (extract(minute from starts_at) IN (0, 30) AND extract(second from starts_at) = 0),
    CONSTRAINT interview_slots_committee_starts_at_unique UNIQUE(committee_id, starts_at)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS interview_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    slot_id uuid NOT NULL REFERENCES interview_slots(id) ON DELETE restrict,
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE cascade,
    booked_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT interview_bookings_slot_unique UNIQUE(slot_id),
    CONSTRAINT interview_bookings_application_unique UNIQUE(application_id)
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS idx_interview_slots_committee_starts_at
  ON interview_slots (committee_id, starts_at)
`;

await sql`
  CREATE INDEX IF NOT EXISTS idx_interview_bookings_application
  ON interview_bookings (application_id)
`;

await sql`
  CREATE TABLE IF NOT EXISTS interview_windows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    singleton integer DEFAULT 1 NOT NULL,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    updated_by uuid REFERENCES users(id) ON DELETE set null,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT interview_windows_singleton_unique UNIQUE (singleton),
    CONSTRAINT interview_windows_singleton_check CHECK (singleton = 1),
    CONSTRAINT interview_windows_range_check CHECK (ends_at > starts_at)
  )
`;

console.log("Interview scheduling tables are ready.");
await sql.end();
