import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE applicant_gender AS ENUM ('male', 'female');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await sql.unsafe(
    "ALTER TABLE applicants ADD COLUMN IF NOT EXISTS birthday date",
  );
  await sql.unsafe(
    "ALTER TABLE applicants ADD COLUMN IF NOT EXISTS gender applicant_gender",
  );
  await sql.unsafe(
    "ALTER TABLE applicants ADD COLUMN IF NOT EXISTS student_number varchar(10)",
  );
  await sql.unsafe(
    "ALTER TABLE applicants ADD COLUMN IF NOT EXISTS contact_number varchar(14)",
  );
  await sql.unsafe(
    "ALTER TABLE applicants ADD COLUMN IF NOT EXISTS facebook_url text",
  );

  await sql.unsafe(`
    DO $$ BEGIN
      ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'registration';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await sql.unsafe(
    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS data_privacy_agreed_at timestamptz",
  );
  await sql.unsafe(
    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS portfolio_url text",
  );
  await sql.unsafe(
    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS github_url text",
  );

  const [{ exists }] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'applications_applicant_id_recruitment_year_unique'
    ) AS exists
  `;
  if (!exists) {
    const dupes = await sql`
      SELECT applicant_id, recruitment_year, COUNT(*)::int AS count
      FROM applications
      GROUP BY applicant_id, recruitment_year
      HAVING COUNT(*) > 1
    `;
    if (dupes.length === 0) {
      await sql.unsafe(`
        ALTER TABLE applications
          ADD CONSTRAINT applications_applicant_id_recruitment_year_unique
          UNIQUE (applicant_id, recruitment_year)
      `);
    } else {
      console.warn(
        "Skipped applications unique constraint: duplicate applicant/year rows exist.",
      );
    }
  }

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS interview_windows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      singleton integer DEFAULT 1 NOT NULL,
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      updated_by uuid REFERENCES users(id) ON DELETE set null,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT interview_windows_singleton_unique UNIQUE (singleton),
      CONSTRAINT interview_windows_singleton_check CHECK (singleton = 1),
      CONSTRAINT interview_windows_range_check CHECK (ends_at > starts_at)
    )
  `);

  console.log("Schema sync complete.");
} finally {
  await sql.end();
}
