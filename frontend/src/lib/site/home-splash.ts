export const HOME_SPLASH_SEEN_KEY = "aws-ust-home-splash-seen"
/** Set by beforeInteractive bootstrap; avoids mutating `<html>` (hydration-safe). */
export const HOME_SPLASH_SKIP_GLOBAL = "__awsUstHomeSplashSkip"
/** Injected before paint on first visit; removed when splash exits (no html classList). */
export const HOME_SPLASH_LOCK_STYLE_ID = "home-splash-lock"

const HOME_SPLASH_LOCK_CSS =
  "html{overflow:hidden}body{overflow:hidden}body::before{content:'';position:fixed;inset:0;z-index:79;background:#170f33;pointer-events:none}"
const HOME_SPLASH_LOCK_FAILSAFE_MS = 8000

export const HOME_SPLASH_MIN_HOLD_MS = 1100
export const HOME_SPLASH_MAX_WAIT_MS = 3500
export const HOME_SPLASH_EXIT_MS = 1200

type HomeSplashWindow = Window &
  typeof globalThis & {
    [HOME_SPLASH_SKIP_GLOBAL]?: 1
  }

export function homeSplashSkipBootstrapScript(): string {
  const css = HOME_SPLASH_LOCK_CSS.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  return `try{var p=location.pathname;if(p!=="/"&&p!=="")return;var s=sessionStorage.getItem("${HOME_SPLASH_SEEN_KEY}");if(s)window.${HOME_SPLASH_SKIP_GLOBAL}=1;else{var el=document.createElement("style");el.id="${HOME_SPLASH_LOCK_STYLE_ID}";el.textContent="${css}";(document.head||document.documentElement).appendChild(el);setTimeout(function(){document.getElementById("${HOME_SPLASH_LOCK_STYLE_ID}")?.remove()},${HOME_SPLASH_LOCK_FAILSAFE_MS})}}catch(e){}`
}

export function clearHomeSplashActiveLock() {
  if (typeof document === "undefined") return
  document.getElementById(HOME_SPLASH_LOCK_STYLE_ID)?.remove()
}

export function markHomeSplashSeen() {
  try {
    sessionStorage.setItem(HOME_SPLASH_SEEN_KEY, "1")
    if (typeof window !== "undefined") {
      (window as HomeSplashWindow)[HOME_SPLASH_SKIP_GLOBAL] = 1
    }
  } catch {
    // sessionStorage may be unavailable in private mode
  }
}

export function shouldSkipHomeSplashClient(): boolean {
  if (typeof window === "undefined") return true
  const win = window as HomeSplashWindow
  if (win[HOME_SPLASH_SKIP_GLOBAL] === 1) return true
  try {
    return sessionStorage.getItem(HOME_SPLASH_SEEN_KEY) === "1"
  } catch {
    return false
  }
}
