import { ROLE_LABELS, type MemberEntry } from "@/lib/members/directory"
import { cn } from "@/lib/utils"

const baseClasses =
  "inline-flex w-fit items-center whitespace-nowrap rounded-pill px-2.5 py-0.5 font-sans text-xs font-medium"
const roleClasses: Record<MemberEntry["role"], string> = {
  eb: "bg-biloba-flower text-haiti",
  director: "bg-daisy-bush text-blue-chalk",
  ea: "bg-daisy-bush/25 text-blue-chalk ring-1 ring-inset ring-daisy-bush",
  staff: "border border-blue-chalk/35 text-blue-chalk",
  general: "border border-blue-chalk/20 text-prelude",
  adviser: "bg-aquamarine/20 text-blue-chalk ring-1 ring-inset ring-aquamarine/50",
}

export function MemberRolePill({ role }: { role: MemberEntry["role"] }) {
  return <span className={cn(baseClasses, roleClasses[role])}>{ROLE_LABELS[role]}</span>
}
