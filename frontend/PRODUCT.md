# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Applicants:** UST students applying to AWS Builders – UST during recruitment (R101), for a committee position, for an Executive Associate (EA) position under an Executive Board officer, or as a member only. They apply, book an interview, see their result, answer redirect offers, pay membership, and keep their digital member ID on their dashboard.
- **HR officers** (Human Resources committee, CHRO's office): review applications, record committee decisions and redirects, release results, and manage recruitment setup and community links. They also run the **Officer Hunt**, a separate round that fills the next Executive Board, directors and executive assistants: its own term year, dates, seats, interview slots, applications and results. Releasing it seats the winners as officers with a reserved Member ID, and opening payments invites them with an officer version of the payment email.
- **Executive Board and committee directors:** have HR dashboard access today and keep it, through the same shared sign-in as HR. They oversee recruitment and review applicants, alongside HR. They are not applicants in this role: results, applications and group links belong to the applicant dashboard, which is where applicants see them. They are members too, so each holds an `officer` seat (seeded, never part of recruitment) with a Member ID reserved for their seat. They sign in on the same applicant sign-in with the Application ID from their welcome email, pay the membership fee like everyone else, and get their digital member ID once it is verified.
- **Finance officers** (CFO, Director for Finance): verify membership payments from GCash reference numbers and Google Drive receipt links. Planned users of the HR dashboard; their sign-in is not built yet (the `finance` role exists but is blocked from the HR dashboard today).

## Product Purpose

Run AWS Builders – UST's yearly recruitment and membership end to end, in one place:

1. Applicants apply, book an interview, and see their result.
2. Officers review applicants, decide acceptances, release results, and redirect some applicants to a different position.
3. Accepted applicants and general members pay membership by GCash; payments are verified, and members get an official digital member ID and links to their groups.

Success means every applicant gets a correct, timely result; officers can process a whole recruitment cycle (466 applicants in 2026) without spreadsheets or manual email; and every verified member ends up with an ID and their group links.

## Positioning

The recruitment and membership system of AWS Builders – UST, "the first cloud org at UST": built by and for its own members, around the org's real structure (Executive Board, executive associates per office, directors, committee staff, general members) and its R101 recruitment cycle.

## Operating Context

- **Recruitment is seasonal.** Work comes in bursts: application windows, interview scheduling, decision and results release, then a payment period, after which each verified member gets one email with their Member ID. Each recruitment year is one cycle (A.Y. 2026–2027 is recruitment year 2026).
- **Officers use the dashboard on all devices:** laptops for long review sessions, phones for checks and quick actions.
- **Bulk moments matter:** releasing results and opening payments each reach hundreds of applicants at once. Emails are sent from a UST Google Workspace account through a rate-limited background queue.
- **Payments:** GCash by QR only (separate QR codes for committee members and for general members); receipts are Google Drive links that officers open to verify.
- **Public verification:** each digital member ID carries a QR that opens a public page confirming whether the member is active.

## Capabilities and Constraints

- **Stack:** Next.js 16 frontend with shadcn/ui on Base UI (never Radix), Tailwind; Hono + Drizzle + Postgres (Neon) backend on AWS Lambda; S3 for uploads; Gmail API for email. Kept within AWS free-tier limits.
- **Applicant side:** application form, interview booking, edit window, dashboard with results, redirect accept/decline (final once confirmed), payment submission, digital member ID with photo, group join links.
- **HR side:** Applications and Archive lists with filters and CSV export, application detail with committee decisions, redirect placement, Results release with live email progress, Committees (approval targets), Recruitment Setup (season dates, interview grid), Payments (period, amount, GCash QRs), Verification, Members list, Community Links.
- **Terminology:** R101 (the recruitment program), EB (Executive Board), EA (executive associate, "Executive Assistant to the <Officer>"), directors, committee staff, general member, redirect (an offer of a position the applicant did not choose), Member ID (`AWS-2627-NNNN` for A.Y. 2026–2027). Numbers follow the hierarchy: the EB takes 0001–0008 (CEO is 0001), then each office's EAs (a block sized by its open EA slots), then the 13 directors, then committee staff, then general members. The three advisers hold 9001–9003, active without paying.
- **Access:** the HR dashboard is used by HR officers, the Executive Board and committee directors. For now there is a single shared sign-in account for all of them, with no per-person accounts or per-role views. Applicants never see it; the applicant dashboard is their place for results, application, payment and member ID.
- **Payments stay in the HR dashboard.** The payments part (Payments, and its membership verification) remains inside the HR dashboard as it is today. Fixing and optimizing it is deferred to a later date, so the current redesign leaves it out of scope.
- **Undecided:** per-person accounts, sign-in for finance officers (an intended HR dashboard user), and whether directors should see only their own committee's applicants or everything. Until these are decided, design the HR dashboard as one view for everyone who signs in.

## Brand Commitments

- Name: **AWS Builders – UST**. Tagline: **"It's Always Day One"**.
- Mascot: **Espi** (`frontend/public/espi.webp`), used across the site, error pages, and the member ID.
- Email sign-off: "Yours in Thomasian Leadership, The AWS Builders - UST Executive Board".
- The public website's visual system is recorded in the root `DESIGN.md` (Figma "AWS website draft").

## Evidence on Hand

- Executive Board and committee director names and photos: `frontend/src/lib/people/index.ts`, `frontend/public/people/`.
- Committee artwork: `frontend/public/committees/`. Adviser photos: `frontend/public/advisers/`.
- Real recruitment scale: 466 applicants in the 2026 results release.
- No testimonials, press, or metrics beyond these exist; do not invent them.

## Product Principles

1. **Never leave an applicant guessing.** Every applicant gets one clear, correct result and knows their next step.
2. **Built for the busy officer.** Bulk work (reviews, results, payments) must be fast, safe, and recoverable, on any device.
3. **Final means final.** Decisions applicants or officers confirm as final (redirect answers, released results, issued Member IDs) are not silently changed.
4. **The org's real structure is the model.** Roles, offices, committees, and Member ID order mirror how AWS Builders – UST is actually organized.
