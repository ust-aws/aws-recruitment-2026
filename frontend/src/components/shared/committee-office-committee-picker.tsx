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
  "flex h-auto min-h-12 w-full cursor-pointer items-center justify-between gap-3 py-2.5 text-left font-sans hover:bg-haiti hover:ring-2 hover:ring-biloba-flower/50 disabled:cursor-not-allowed disabled:opacity-50"
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

type CommitteeOfficeCommitteePickerProps = {
  id?: string
  committee: string
  groups: CommitteeOfficeGroup[]
  disabled?: boolean
  placeholder?: string
  onSelect: (committee: string) => void
}

export function CommitteeOfficeCommitteePicker({
  id,
  committee,
  groups,
  disabled = false,
  placeholder = "Select an office and committee",
  onSelect,
}: CommitteeOfficeCommitteePickerProps) {
  const office = officeForCommittee(committee)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        type="button"
        disabled={disabled}
        className={triggerClasses}
      >
        {committee ? (
          <span className={triggerCopyClasses}>
            <span className={triggerOfficeClasses}>
              {office || "Selected office"}
            </span>
            <span className={triggerCommitteeClasses}>{committee}</span>
          </span>
        ) : (
          <span className={cn(triggerCopyClasses, triggerPlaceholderClasses)}>
            {placeholder}
          </span>
        )}
        <ChevronDownIcon className={triggerIconClasses} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={menuClasses}>
        {groups.map((group) => (
          <DropdownMenuSub key={group.office}>
            <DropdownMenuSubTrigger
              className={cn(
                itemHoverClasses,
                group.committees.includes(committee) && officeSelectedClasses
              )}
            >
              {group.office}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={subMenuClasses}>
              {group.committees.map((name) => (
                <DropdownMenuItem
                  key={name}
                  className={itemHoverClasses}
                  onClick={() => onSelect(name)}
                >
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {committee === name ? (
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
