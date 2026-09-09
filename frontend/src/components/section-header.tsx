import type { ReactNode } from "react"
import { displayTitleLeadingClasses } from "@/lib/surface"
import { cn } from "@/lib/utils"

const eyebrowClasses =
  "w-fit font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const titleClasses = cn(
  "max-w-[640px] font-sans text-4xl font-bold text-blue-chalk md:text-5xl",
  displayTitleLeadingClasses
)
const subtitleClasses =
  "max-w-[680px] font-sans text-base leading-relaxed text-prelude"

type SectionHeaderProps = {
  eyebrow: string
  title: ReactNode
  subtitle?: string
  className?: string
  titleClassName?: string
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className={eyebrowClasses}>{eyebrow}</p>
      <h2 className={cn(titleClasses, titleClassName)}>{title}</h2>
      {subtitle && <p className={subtitleClasses}>{subtitle}</p>}
    </div>
  )
}
