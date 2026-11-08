"use client"

import { CheckIcon, ChevronDownIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  officeForCommittee,
  type CommitteeOfficeGroup,
} from "@/lib/apply/committee-groups"
import { fieldControlClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const triggerClasses = cn(
  fieldControlClasses,
  "flex h-auto min-h-12 w-full cursor-pointer items-center justify-between gap-3 border border-blue-chalk/20 py-2.5 text-left font-sans transition-colors hover:border-biloba-flower/50 hover:bg-haiti/90"
)
const triggerCopyClasses = "flex min-w-0 flex-1 flex-col gap-0.5"
const triggerOfficeClasses = "truncate text-sm font-medium text-blue-chalk"
const triggerCommitteeClasses = "truncate font-mono text-[0.7rem] text-prelude"
const triggerPlaceholderClasses = "text-sm text-prelude/70"
const triggerIconClasses = "size-4 shrink-0 text-prelude"
const menuClasses =
  "min-w-[17rem] rounded-[14px] border border-blue-chalk/25 bg-haiti p-1 text-blue-chalk shadow-md ring-1 ring-blue-chalk/15"
const itemHoverClasses =
  "cursor-pointer rounded-md px-2 py-2 font-sans text-sm text-blue-chalk hover:bg-biloba-flower hover:text-haiti focus:bg-biloba-flower focus:text-haiti data-highlighted:bg-biloba-flower data-highlighted:text-haiti data-open:bg-biloba-flower data-open:text-haiti data-popup-open:bg-biloba-flower data-popup-open:text-haiti"
const officeSelectedClasses = "bg-meteorite/80"
const selectedIconClasses =
  "size-4 shrink-0 text-aquamarine group-hover/dropdown-menu-item:text-haiti data-highlighted:text-haiti"
const subMenuClasses =
  "min-w-[16rem] rounded-[14px] border border-blue-chalk/25 bg-haiti p-1 text-blue-chalk shadow-md ring-1 ring-blue-chalk/15"

const countClasses = "ml-auto pl-4 font-sans text-xs tabular-nums opacity-70"

type HrCommitteeFilterPickerProps = {
  value: string
  groups: CommitteeOfficeGroup[]
  onChange: (committee: string) => void
  /** How many people each committee holds, shown beside it and totalled for the office. */
  counts?: Record<string, number>
  /** The count for "All Committees". */
  total?: number
}

function CountLabel({ count }: { count: number | undefined }) {
  return count === undefined ? null : <span className={countClasses}>{count}</span>
}

export function HrCommitteeFilterPicker({
  value,
  groups,
  onChange,
  counts,
  total,
}: HrCommitteeFilterPickerProps) {
  const office = value ? officeForCommittee(value) || "Other committees" : ""
  const officeTotal = (group: CommitteeOfficeGroup) =>
    counts ? group.committees.reduce((sum, name) => sum + (counts[name] ?? 0), 0) : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger type="button" className={triggerClasses}>
        {value ? (
          <span className={triggerCopyClasses}>
            <span className={triggerOfficeClasses}>
              {office || "Selected office"}
            </span>
            <span className={triggerCommitteeClasses}>{value}</span>
          </span>
        ) : (
          <span className={cn(triggerCopyClasses, triggerPlaceholderClasses)}>
            All Committees
          </span>
        )}
        <ChevronDownIcon className={triggerIconClasses} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={menuClasses}>
        <DropdownMenuItem
          className={itemHoverClasses}
          onClick={() => onChange("")}
        >
          All Committees
          <CountLabel count={total} />
          {!value ? <CheckIcon className={selectedIconClasses} /> : null}
        </DropdownMenuItem>
        {groups.map((group) => (
          <DropdownMenuSub key={group.office}>
            <DropdownMenuSubTrigger
              className={cn(
                itemHoverClasses,
                group.committees.includes(value) && officeSelectedClasses
              )}
            >
              {group.office}
              <CountLabel count={officeTotal(group)} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={subMenuClasses}>
              {group.committees.map((name) => (
                <DropdownMenuItem
                  key={name}
                  className={itemHoverClasses}
                  onClick={() => onChange(name)}
                >
                  {name}
                  <CountLabel count={counts?.[name]} />
                  {value === name ? (
                    <CheckIcon className={selectedIconClasses} />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
