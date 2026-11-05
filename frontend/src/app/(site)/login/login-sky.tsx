import { LoginSkyScene } from "./login-sky-scene"

// A vector night sky in the member-ID painting's style, crisp at any size, with
// a crescent moon above the clouds. While a sign-in is in flight the sky lifts,
// the dawn rises to the cloud line and the clouds catch the light (the pending
// state); all of it sinks back if the sign-in fails.
const skyClasses =
  "group relative isolate h-44 overflow-hidden bg-haiti lg:h-auto lg:min-h-svh"
const fadeClasses =
  "pointer-events-none absolute opacity-0 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[rising=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-opacity"
// Lifts the whole night from the top so the stars wash out as day comes.
const skyLiftClasses = `${fadeClasses} inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--biloba-flower)_38%,transparent),color-mix(in_oklch,var(--biloba-flower)_12%,transparent)_50%,transparent_75%)] mix-blend-screen`
// The dawn itself: rises from below to the cloud line.
const dawnClasses = `${fadeClasses} inset-0 translate-y-[14%] bg-[radial-gradient(80%_45%_at_50%_92%,color-mix(in_oklch,var(--aquamarine)_80%,transparent)_0%,color-mix(in_oklch,var(--aquamarine)_30%,transparent)_45%,transparent_80%)] mix-blend-screen group-data-[rising=true]:translate-y-0`
const taglineWrapClasses =
  "absolute inset-x-10 top-16 hidden lg:block xl:inset-x-16 xl:top-20 2xl:inset-x-20 2xl:top-24"
const taglineClasses =
  "max-w-[11ch] font-sans text-6xl font-bold leading-[0.98] tracking-[-0.03em] text-balance text-blue-chalk xl:text-[5.25rem] 2xl:text-8xl"
const accentClasses = "text-aquamarine"
// A crescent moon high in the night in the sky's palette: lit edge to violet
// horns, a crisp edge, a soft terminator and a violet halo. As the dawn rises it
// sinks toward the clouds and fades. The viewBox leaves room for the halo.
const moonWrapClasses =
  "espi-rise pointer-events-none absolute right-4 top-0 w-24 lg:right-[11%] lg:top-[12%] lg:w-[min(14rem,22%)]"
const moonClasses =
  "block w-full transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[rising=true]:translate-y-[40%] group-data-[rising=true]:opacity-30 motion-reduce:translate-y-0 motion-reduce:transition-opacity lg:group-data-[rising=true]:translate-y-[80%]"

export function LoginSky({ rising }: { rising: boolean }) {
  return (
    <div className={skyClasses} data-rising={rising} aria-hidden="true">
      <LoginSkyScene />
      <span className={skyLiftClasses} />
      <span className={dawnClasses} />
      <div className={taglineWrapClasses}>
        <p className={taglineClasses}>
          It&rsquo;s Always <span className={accentClasses}>Day One.</span>
        </p>
      </div>
      <div className={moonWrapClasses}>
        <svg viewBox="-30 -30 160 160" className={moonClasses}>
          <defs>
            <radialGradient id="login-moon-halo">
              <stop offset="0%" stopColor="var(--biloba-flower)" stopOpacity="0.4" />
              <stop offset="55%" stopColor="var(--biloba-flower)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--biloba-flower)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="login-moon-fill" gradientUnits="userSpaceOnUse" cx="28" cy="62" r="62">
              <stop offset="0%" stopColor="var(--blue-chalk)" />
              <stop offset="50%" stopColor="var(--prelude)" />
              <stop offset="100%" stopColor="var(--biloba-flower)" />
            </radialGradient>
            <filter id="login-moon-terminator" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            <mask id="login-moon-cut">
              <rect x="-30" y="-30" width="160" height="160" fill="white" />
              <circle cx="66" cy="38" r="36" fill="black" filter="url(#login-moon-terminator)" />
            </mask>
          </defs>
          <circle cx="50" cy="50" r="78" fill="url(#login-moon-halo)" />
          <circle cx="50" cy="50" r="42" fill="url(#login-moon-fill)" mask="url(#login-moon-cut)" />
        </svg>
      </div>
    </div>
  )
}
