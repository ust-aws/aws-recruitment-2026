// The night sky drawn as vector art in the member-ID painting's style (violet
// gradient, scattered stars, three banks of puffy clouds) so it stays crisp at
// any size. A wide 1600x1000 canvas with `slice` + bottom alignment fits the
// pane by height on
// lg+, so the cloud line holds on wide screens; the phone band frames the
// cloud tops and some sky instead. Each bank is
// shaded as one shape (user-space gradients, so overlapping puffs leave no
// seams) and has an opaque dawn copy, faded in by the parent's `data-rising`
// so overlapping puffs blend evenly.

// Deterministic pseudo-random in [0, 1), rounded so server and client agree.
const rand = (seed: number) =>
  Math.round(((((Math.sin(seed * 12.9898) * 43758.5453) % 1) + 1) % 1) * 1000) / 1000

type Bank = { id: string; base: number; minR: number; maxR: number; step: number; top: string; bottom: string; seed: number }

const BANKS: Bank[] = [
  { id: "far", base: 610, minR: 55, maxR: 100, step: 72, top: "#8c62e4", bottom: "#5a33b0", seed: 11 },
  { id: "mid", base: 735, minR: 65, maxR: 120, step: 92, top: "#a47ff2", bottom: "#6a3fc3", seed: 37 },
  { id: "near", base: 870, minR: 75, maxR: 135, step: 112, top: "#bd9cf8", bottom: "#7b4ace", seed: 73 },
]

function puffs(bank: Bank) {
  const circles: { cx: number; cy: number; r: number }[] = []
  for (let i = 0, x = -60; x < 1680; i++) {
    const r = Math.round(bank.minR + rand(bank.seed + i) * (bank.maxR - bank.minR))
    const cy = Math.round(bank.base - r * 0.45 + (rand(bank.seed + i + 50) - 0.5) * 36)
    circles.push({ cx: x, cy, r })
    x += Math.round(bank.step * (0.75 + rand(bank.seed + i + 100) * 0.5))
  }
  return circles
}

const SCENE = BANKS.map((bank) => ({ ...bank, circles: puffs(bank), crest: bank.base - bank.maxR }))

const STARS = Array.from({ length: 100 }, (_, i) => ({
  x: Math.round(rand(i + 1) * 16000) / 10,
  y: Math.round(rand(i + 201) * 6000) / 10,
  r: Math.round((0.8 + rand(i + 401) * 1.6) * 10) / 10,
  o: Math.round((0.35 + rand(i + 601) * 0.55) * 100) / 100,
}))

// Phones: a box 2.22x the band's height, raised so the band shows y≈380–830.
const svgClasses =
  "absolute inset-x-0 -top-[84%] h-[222%] w-full lg:inset-0 lg:top-0 lg:h-full"
const litClasses =
  "opacity-0 mix-blend-screen transition-opacity duration-700 group-data-[rising=true]:opacity-60"

export function LoginSkyScene() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className={svgClasses}>
      <defs>
        <linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24106a" />
          <stop offset="45%" stopColor="#3b1d93" />
          <stop offset="75%" stopColor="#5b34c0" />
          <stop offset="100%" stopColor="#7a4fd6" />
        </linearGradient>
        <radialGradient id="sky-glow" cx="50%" cy="72%" r="55%">
          <stop offset="0%" stopColor="#a27cf2" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a27cf2" stopOpacity="0" />
        </radialGradient>
        {SCENE.map((bank) => (
          <linearGradient key={bank.id} id={`cloud-${bank.id}-fill`} gradientUnits="userSpaceOnUse" x1="0" y1={bank.crest} x2="0" y2={bank.base + 160}>
            <stop offset="0%" stopColor={bank.top} />
            <stop offset="100%" stopColor={bank.bottom} />
          </linearGradient>
        ))}
        {SCENE.map((bank) => (
          <linearGradient key={bank.id} id={`cloud-${bank.id}-lit`} gradientUnits="userSpaceOnUse" x1="0" y1={bank.crest} x2="0" y2={bank.base + 120}>
            <stop offset="0%" stopColor="#9af7da" />
            <stop offset="55%" stopColor={bank.top} />
            <stop offset="100%" stopColor={bank.bottom} />
          </linearGradient>
        ))}
        {SCENE.map((bank) => (
          <g key={bank.id} id={`cloud-${bank.id}`}>
            {bank.circles.map(({ cx, cy, r }) => (
              <circle key={cx} cx={cx} cy={cy} r={r} />
            ))}
            <rect x="-200" y={bank.base - 20} width="2000" height={1080 - bank.base} />
          </g>
        ))}
      </defs>
      <rect width="1600" height="1000" fill="url(#sky-fill)" />
      <g fill="#f3eeff">
        {STARS.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} opacity={star.o} />
        ))}
      </g>
      <rect width="1600" height="1000" fill="url(#sky-glow)" />
      {SCENE.map((bank) => (
        <g key={bank.id}>
          <use href={`#cloud-${bank.id}`} fill={`url(#cloud-${bank.id}-fill)`} />
          <use href={`#cloud-${bank.id}`} fill={`url(#cloud-${bank.id}-lit)`} className={litClasses} />
        </g>
      ))}
    </svg>
  )
}
