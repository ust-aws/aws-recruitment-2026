import { clickHintClasses } from "./constants"

export function HeroCloudClickHint() {
  return (
    <span aria-hidden className={clickHintClasses}>
      click me!
    </span>
  )
}
