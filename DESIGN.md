# Design System

Source of truth: [Figma — AWS website draft](https://www.figma.com/design/SfU56ovh7ir0ge9cGtTsWo/AWS-website-draft?node-id=47-64)

This file is the design basis for every frontend component in this repo. When a
component's look or copy is unclear, check the Figma file (node IDs are noted
below) before guessing.

## Component library

This repository must use [shadcn/ui](https://ui.shadcn.com) for UI primitives
(buttons, cards, dialogs, inputs, etc.) — already initialized in `frontend/`
(`components.json`, `src/lib/utils.ts`, `src/components/ui/`). Add new
components with `npx shadcn@latest add <component>` rather than hand-rolling
primitives; extend the generated component source directly for one-off
variants instead of wrapping it. Style/theme new components against the
tokens below (`@theme inline` in `globals.css`), not shadcn's defaults.

## Theme

Dark, terminal/dev-inspired. Deep navy-violet background, glassmorphic
(blurred, translucent) cards and pills, monospace "$ command" labels used as
section eyebrows and terminal-flavored copy, Poppins for headings/body,
JetBrains Mono for anything meant to read as a shell/code snippet.

## Tokens

### Color

| Name | Hex | Use |
|---|---|---|
| `haiti` | `#170F33` | Base background (near-black navy), navbar bar fill |
| `jacarta` | `#2A1259` | Page/section purple background (lighter than `haiti`) — eye-matched from screenshots, confirm against Figma |
| `aquamarine` | `#5AF0C0` | Cyan/blue CTA fill, accordion `+` icon, active nav pill — eye-matched from screenshots, confirm against Figma |
| `daisy-bush` | `#46258A` | Accent violet, purple button fill |
| `meteorite` | `#3F247C` | Primary button fill, card overlays (also at 55% opacity: `rgba(63,36,124,0.55)`) |
| `biloba-flower` | `#B78CF0` | Accent/highlight violet (also at 15%: `rgba(183,140,240,0.15)`) |
| `prelude` | `#C6B8E8` | Terminal/mono text on dark backgrounds |
| `blue-chalk` | `#F3EEFF` | Primary body text on dark backgrounds (near-white); also used at 15%/25% opacity for borders |
| `white` | `#FFFFFF` | Emphasis text, icon backgrounds; also at 12%/15% opacity for hairline borders |
| `black` | `#000000` | Shadows, at 12% opacity |

Borders on cards/pills are typically `1px solid` `blue-chalk` at 15–25% opacity.
Overlay panels (nav dropdown, etc.) use `blue-chalk`/`haiti` at low opacity with
a backdrop blur (`12px` — raised from an earlier `4–5px` note; at 12px the
background glow blobs actually read through glass surfaces instead of just
softening a flat color).

### Glassmorphism

Glass surfaces use the `glass` utility (`frontend/src/app/globals.css`),
composable with any `bg-*/NN` and border color:

```css
@utility glass {
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  box-shadow:
    inset 0 1px 0 0 color-mix(in oklch, var(--blue-chalk) 12%, transparent),
    0 8px 32px -8px color-mix(in oklch, black 45%, transparent);
}
```

`--glass-blur` is `12px`. `glass` deliberately sets no background-color and
no border — each component supplies its own translucent fill and hue-matched
border so utility ordering never fights. Recipe: translucent fill at 40–55%
opacity, a 1px hue-matched border at 15–40% opacity, the inset top highlight
(this is what sells "glass" over "blurry"), and an ambient drop shadow.
**Light fills need higher opacity than dark ones** to hold text contrast —
e.g. the cyan button sits at `aquamarine/85` so `haiti` text stays legible,
while the purple button holds `daisy-bush/55`. Glass only reads as glass over
a background with variation — the page has soft violet radial-gradient glow
blobs behind it (`body::before`, `z-index: -1`) for exactly this reason; glass
over a flat color is indistinguishable from a solid fill.

### Typography

Fonts: **Poppins** (headings, body copy, buttons), **JetBrains Mono** (terminal
labels, code snippets, small caps eyebrows).

| Style | Font | Weight | Size |
|---|---|---|---|
| Heading 2 | Poppins | Bold (700) | 44.8px |
| Heading 3 | Poppins | Bold (700) | 17.6px |
| Heading 4 | Poppins | Bold (700) | 16px |
| Body | Poppins | Regular (400) | 14–18px |
| Body (emphasis) | Poppins | SemiBold (600) / Medium (500) | 14.4px |
| Button label | JetBrains Mono | Regular (400) | 11.5px, line-height 15px |
| Terminal / code | JetBrains Mono | Regular (400) | 11.5–15px |

Line-height runs ~1.0 in Figma (manually set per line); translate to a normal
CSS line-height (~1.4–1.6) for body copy in code, matching the visual spacing
in the screenshots, not the raw `100%` value.

### Spacing & radius

- Spacing scale (px): `2, 3, 7, 8, 10, 12, 13, 15, 24, 26, 44`
- Corner radius (px): `4, 9, 13, 14, 20, 22, 23.5, 28, 50, 100` — `100` (fully
  rounded) is the standard pill radius for buttons and nav chips
- Stroke width: `1px`
- Content max-widths: `640` (hero headline), `680` (section intro column),
  `900` (hero content), `1180` (page content), `1856–1920` (full-bleed
  section backgrounds)

## Layout conventions

- Page content is centered in a `1180px` column with generous outer padding.
- The navbar is a **full-bleed** glass bar spanning the full viewport width,
  with its contents (logo, links, CTA) held to the same `1180px` column as
  the rest of the page — the `100px` pill radius still applies to nav chips
  (active link pill, mobile links), just not to the bar itself.
- Each major section opens with a small pill-shaped "`$ command`" eyebrow
  label in JetBrains Mono (e.g. `$ whoami`, `$ what-we-do`,
  `$ builders --start`, `$ ls committees/`, `$ cat events.log`,
  `$ join --now`), then a Heading 2, then a one-paragraph intro.
- Buttons are glass rounded-rects at radius `14`, both variants the same
  shape and border treatment, differing only in hue: **cyan** =
  `aquamarine`-tinted fill/border, `haiti` text; **purple** = `daisy-bush`-
  tinted fill, `biloba-flower`-tinted border, `blue-chalk` text.
- **Button label copy:** capitalize the first letter of every word (title
  style), including loading states — e.g. `Stop Applications`, `Save Email`,
  `Sign In`. Use the shared `Button` component (`formatButtonLabel` applies
  this automatically); keep source strings in the same style for readability.
  Transactional email CTAs use the same rule via `ctaButton` in
  `backend/src/lib/email/template-kit.ts` (`formatEmailButtonLabel`).
- **Filter dropdowns (HR admin):** table and list filters use the shared
  `Select` trigger styling — `hrFilterSelectClasses` in
  `frontend/src/lib/site/surface.ts` (`fieldControlClasses` plus
  `justify-between` and a `blue-chalk/20` hairline border). Match the search
  field height (`h-12`, `rounded-[20px]`, `bg-haiti/70`, aquamarine focus
  ring). The open menu uses the default select panel (`rounded-[14px]`,
  `bg-haiti`, `border-blue-chalk/25`). **Never show raw enum values** in the
  trigger (e.g. `awaiting_payment`); always map to title-case labels such as
  `Awaiting Payment`, `All Statuses`, `Committee Applicants`. Follow the same
  pattern as `application-filters.tsx` — pass explicit children to
  `SelectValue`, not an empty value slot.
- **Subheaders (HR admin):** numbered section titles (`HrPaymentSection`),
  sidebar group labels, and summary stat card labels use the same **title-case**
  copy rule as buttons (`formatSubheaderLabel` / `formatButtonLabel` in
  `frontend/src/lib/site/button-label.ts`). Style with `subheaderLabelClasses`
  in `surface.ts` (JetBrains Mono, `text-[10px]`, tracking — **no** Tailwind
  `uppercase` transform). Page subtitles and section **descriptions** stay
  sentence case; only short labels and secondary headings get title case.
- Cards/panels use `meteorite` (or `blue-chalk`-low-opacity) fills with a
  hairline border and rounded corners (14–28px), sometimes with backdrop
  blur.

## Page sections (top → bottom)

| Section | Figma node | Notes |
|---|---|---|
| **Navbar** | `5:15518` | Logo, `$ nav` dropdown (opens: about-us / the-people / events), primary CTA "Join us! →" |
| **Hero** | `5:15002` | "It's always day one!" headline art, tagline, terminal `git commit -m 'first stack shipped\|` snippet, primary + secondary CTA buttons |
| **Mission and Vision** | `5:15053` (`$ whoami`) | Intro heading "The first cloud org at UST.", two-column `// mission` / `// vision` cards |
| **What we do** | `5:15100` (`$ what-we-do`) | "How our members grow.", 3 feature cards: workshops, certification track, hackathon |
| **Build your Stack** | `5:15147` (`$ builders --start`) | "Build your first stack.", Espi mascot + instructions, interactive 5-service stack builder with a live counter and deploy/reset buttons |
| **Committees** | `5:15224` (`$ ls committees/`) | "Run by builders, for builders.", embedded **Quiz** ("Pick a Saturday activity", 4 options), Executive Board + Committee-member profile cards, 13-button committee picker grid |
| **Quiz** | inside `5:15224` (`5:15233`) | Currently nested inside the Committees section, not a standalone section — "Pick a Saturday activity", 4 answer buttons. Treat as a component the Committees section composes. |
| Events | `5:15399` (`$ cat events.log`) | Draggable/scrollable event cards (emoji icon, date, title, blurb) — not in the original issue list but part of the page flow |
| **Join / CTA** | `5:15472` (`$ join --now`) | "Ready to build with us?", mascot + logo, CTA buttons |
| Footer | `5:15049` | Copyright line only |

**FAQ Section**: not present anywhere in the current Figma draft. There's no
FAQ content or accordion pattern to reference yet — flag with design before
building; a reasonable default is a `blue-chalk`-bordered card list matching
the Mission/Vision or feature-card styling, using an accordion for
expand/collapse.

## Basic components

Component inventory lives in the Figma file's dedicated "Components" canvas
section (frame `5:14930`), each with `default`/`hover` variants:

| Component | Figma | Variants |
|---|---|---|
| **Button** | `Component 1` | primary (solid), secondary (outline) — both pill-shaped, hover state included |
| Nav/footer text link | `Component 2` | single style, hover state (color shift) |
| Stack service row | `Component 3` | 5 variants (one per AWS service row in Build-your-Stack) |
| Quiz option button | `Component 4` | 2 variants (selected/unselected), hover state |
| Avatar / social icon | `Component 5` | 3 variants, hover state |
| Committee icon button | `Component 6` | 1 variant, no hover recorded |
| Small text link / tag | `Component 7` | 1 variant, hover state |
| Nav dropdown item | `Component 8` | 3 variants, hover state |

**Header component**: no single reusable "Header" component exists in Figma —
"Header" in the design refers to the Hero section (node `5:15002`). The
navbar (`5:15518`) is the actual persistent header/nav across the page; build
that as the shared `Header`/`Navbar` component.

**Accordion**: implemented at `frontend/src/components/ui/accordion.tsx`
(shadcn/Base UI, restyled) — hairline-separated rows, `aquamarine` `+` icon
that rotates to an × on open. Use this as the reference until Figma has one.

## Gaps to flag with design

- No FAQ content or accordion pattern in Figma yet.
- Quiz is embedded in Committees, not a standalone section — confirm whether
  it should be pulled out before building it as its own component per the
  tracked issue.

## Dashboard working surfaces (HR and applicant)

The HR dashboard and the applicant dashboard are Operate surfaces: palette and
type above are unchanged, but the working areas differ from the public site.

- **Solid, not glass.** Panels, rows and tables use the classes in
  `frontend/src/lib/site/dashboard-surface.ts` (solid `haiti` fill, 1px
  `blue-chalk` hairline). `glass` stays on dialogs, menus, sheets and the
  public site. Do not change `glassPanelClasses` for dashboard work; it is
  shared with the public pages and the payments screens.
- **Eyebrows name the area, never the title.** Dashboard page headers keep the
  site's mono `// LABEL`, but it says something the title does not
  (`// MEMBERSHIP` over Members, `// SEASON STATUS` over Overview), at the
  dashboard title scale (24-30px), not the public site's 48px.
- **12px floor.** Any text that carries data is at least 12px, in the same
  fonts. The 10px mono labels remain only for sidebar group names.
- **Density by pointer.** Compact rows for mouse and trackpad; 44px targets on
  coarse pointers (`pointer-coarse:`). The Applications table starts at the
  `xl` breakpoint because the persistent sidebar takes 256px; below that,
  rows are two lines.
- **One accent job.** `aquamarine` marks the single thing that needs work on a
  screen (the lit station on the stage line, counts that need an officer).
- **Stage line.** The recruitment stages (Applied, Interview booked, Decided,
  Released, Payment sent, Member) are drawn as one vertical line of stations in
  the Overview rail. Counts are running totals defined once in
  `backend/src/lib/hr/season-overview.ts`. Only the station that needs work is
  aquamarine; a station is drawn as done only when something reached it.
- **Worklist.** Ready tasks first, then blocked, then watching, with one
  aquamarine button on the first ready row. Rows switch layout on their own
  panel width (container queries), not the viewport.
- **Members.** Scope tabs (Members, Not paid yet) over a toolbar of search
  (`/` focuses it), one dropdown, a List / By committee switch and Export. Paid
  members come first in Member ID order, advisers included (they are active
  without paying), then the Executive Board and directors who have not paid
  yet, each showing the number held for their seat ("Reserved AWS-2627-0001").
  Advisers have their own filter and group. By committee nests each committee
  under its executive office.
  Not paid yet reads from the payments dashboard and says "Pay by" or
  "Expired". Student No. and Section show from 1400px.
- **Payments.** One page (`/admin/hr/payments`, `?tab=review|all|setup`;
  the old `/admin/hr/membership` redirects to the review tab). A status strip
  of counts in work order (Pending verification first, Eligible last) filters
  the list; only a pending count above zero is aquamarine. Tabs: To review
  (pending receipts, oldest first) and All payments (Members toolbar and
  filters). The period, amount and GCash QRs live on their own page,
  Payment Setup (`/admin/hr/payments/setup`, its own sidebar entry), and
  Payments points to it while the period or amount is missing. Export and Retry
  Invitations sit beside the tabs. A row opens a review panel, docked and sticky from 1280px and a sheet
  below: facts, every submission with a large mono reference and copy, then
  Verify (the one aquamarine button) or Reject / Reverse with a reason and a
  new deadline. A decision moves to the next receipt and focuses it; ↑ / ↓
  and Esc work unless a field, menu or picker has the key. Rows lay out by
  the table's own width (container queries).
- **HR sidebar.** Grouped by what the work is, not by page: Overview alone
  at the top; Recruitment (Applications, Results, Archive); Membership
  (Members, Payments, Community Links); and Setup, folded to one row at the
  foot. R101 and the Officer Hunt run the same pipeline, so Recruitment is one
  group with a two-segment round switch (R101 / Officer Hunt) above its rows;
  the chosen round is the filled segment, and the switch lands on the same kind
  of page in the other round (Results to Results). Setup (R101 season, Officer
  hunt, Committees, Payment period) is configuration visited a few times a
  season, so it stays folded until the current page is inside it. On the icon
  rail the switch is one button that flips the round and Setup lists its pages
  directly. Every group below Overview is set off by a hairline. Rows are
  compact (36px, 44px on touch); the only lit things are the current page's
  pill and its aquamarine icon. Navigation lives in
  `frontend/src/components/hr/hr-navigation.ts`, drawn by
  `hr-sidebar-navigation.tsx`, `hr-round-switch.tsx` and `hr-sidebar-fold.tsx`.
- **Applicant dashboard.** One column of solid sections in a fixed order:
  identity, result or application (choices, interview, edit choices),
  groups, payment, membership ID. The page title is the h1 and its subtitle
  is one factual line per state (`frontend/src/lib/apply/dashboard-state.ts`).
  Identity shows name, applicant code and one status chip; everything the
  applicant submitted folds into "Your application", open while the edit
  window is open. Every section uses `ApplicantSection`: a `// AREA` label,
  a short title, one status line saying where the applicant stands (the
  committee they got, the payment status, the booked interview), then detail
  as ruled rows rather than nested cards. Only the "Reply needed" chip and a
  ready-to-confirm interview slot are aquamarine; other buttons are purple.
  Group links are plain rows with an outbound arrow.
- **R101 trail and milestone sky (applicant personality).** Under the name, a
  line of stations (Applied, Interview, Results, Payment, Member; member-only:
  Registered, Approval, Payment, Member) fills from the start to "you are
  here" on load (`frontend/src/lib/apply/r101-trail.ts`). The current station
  is aquamarine and pulses three times only when the applicant has something
  to do; otherwise it is biloba-flower. The newest milestone the applicant
  earned (their acceptance, or their ID once it exists) opens on the ID card's
  night sky (`/member-id/back-bg.png`) with Espi rising from the clouds; only
  one section per page gets it. Motion utilities `trail-fill`,
  `trail-beacon` and `espi-rise` live in `globals.css` and stop under reduced
  motion.
