---
version: 1
slug: "src-app-site-login"
primary_target: "src/app/(site)/login"
related_targets: []
---

# Staff sign-in (surface brief)

Mode: Operate. Established world: DESIGN.md palette, Poppins / JetBrains Mono, `glass`, the member-ID night sky (`/member-id/back-bg.webp`) and Espi.

## Task and audience
- HR, Finance and Marketing officers, each with a personal account, on laptops before review sessions and phones for quick checks. Job: get into their team's dashboard fast; one form, the account's role decides the dashboard.

## Confirmed decisions (user)
- One form for every team; no team picker.
- Personal accounts; copy speaks to the individual officer.
- Wow from the brand moment: night sky, clouds, Espi. Layout "Day One sunrise" chosen on the decision page.
- Copy: eyebrow `$ auth login --staff`, title "Good to see you, builder.", "UST Email", "← Back to site"; no "Forgot password?" until a reset flow exists. Post-sign-in redirect unchanged until roles ship.

## Direction contract: Staff sign-in
THESIS: Signing in is the start of the day: the night sky dawns as you get in. Refuses the centred card on a dot field.
OWN-WORLD: Solid haiti form column, hairline divider, member-ID night sky with a white cloud bank, Espi, Poppins display tagline; aquamarine only on the Sign In button and "Day One."
STORY: An officer lands, sees the org's sky, types email and password, watches dawn rise while the server answers, and arrives in their dashboard.
FIRST VIEWPORT: lg+: 560px left column (brand top, eyebrow/title/subtitle, UST Email, Password with reveal, Sign In, team line, back link at foot); right fills with sky, "// R101 · A.Y. 2026–2027" and "It's Always Day One." at 84px top-left, Espi on the cloud line. Below lg: 180px sky band with Espi on top, form below, tagline hidden.
FORM: Split pane with live sky; dealt lead (index 4 of 7 grounded structures), seed:09043199976970f7. Signature move: the dawn glow behind the clouds is the pending state; it falls back on error and fills on success. Motion: Espi rises once on load; dawn rises over ~600ms ease-out; reduced motion keeps only a brightness change.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Later user decisions (supersede the copy above)
- Espi removed from the sky; the member ID's cloud-lettered wordmark (`/member-id/back-logo.webp`) takes its place.
- Title "Good to see you, Builder." (capital B). Label "Email", placeholder "Enter your email" (never a real account address as a hint). The "For HR, Finance and Marketing officers." line is removed.
- The `$ auth login --staff` eyebrow is kept (told about the floor's eyebrow ban, the user chose to keep it), recoloured to biloba-flower.
- The button stays "Sign in" (shared `formatButtonLabel` unchanged by user choice).
- Finish review: three verdict rounds; the last reported regression (phone cloud bank lifted off the band) was fixed and verified by capture, not re-scored.
- Seamless sky (user request): the pasted cloud.webp puffs were removed; the painting's own clouds are the bank. The dawn lights them through a luminance mask of the same image; the wordmark sits on a feathered lavender haze with a violet shadow.
- The cloud-lettered wordmark was replaced (user request) by the home hero's sleepy cloud (cloud.webp + cloud-face.webp, hero-cloud-float bob), lit from behind at dawn.
- The sleepy cloud was replaced (user request) by a crescent moon (inline SVG) high on the right; at dawn it sinks toward the clouds and fades.
- Vector sky (user request: the raster looked low quality): login-sky-scene.tsx draws the sky, stars and three cloud banks as SVG in the painting's style; the moon's blur filter was removed for a crisp edge. back-bg.webp is no longer used here.
