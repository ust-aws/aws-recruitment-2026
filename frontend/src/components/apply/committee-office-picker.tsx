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
  "flex h-auto min-h-12 cursor-pointer items-center justify-between gap-3 py-2.5 text-left font-sans hover:bg-haiti hover:ring-2 hover:ring-biloba-flower/50 disabled:cursor-not-allowed disabled:opacity-50"
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
const committeeCopyClasses = "flex min-w-0 flex-1 flex-col gap-0.5 text-left"
const metaClasses = "font-mono text-[0.65rem] leading-snug opacity-80"
const selectedIconClasses = "size-4 shrink-0 text-aquamarine group-hover/dropdown-menu-item:text-haiti data-highlighted:text-haiti"
const subMenuClasses =
  "min-w-[16rem] rounded-[14px] border border-blue-chalk/25 bg-haiti p-1 text-blue-chalk shadow-md ring-1 ring-blue-chalk/15"

type PositionOption = {
  id: string
  committee: string
  title: string
}

type CommitteeOfficePickerProps = {
  id?: string
  committee: string
  positionId: string
  groups: CommitteeOfficeGroup[]
  positions: PositionOption[]
  disabled?: boolean
  disabledPositionId?: string
  placeholder?: string
  onSelect: (next: { committee: string; positionId: string }) => void
}

export function CommitteeOfficePicker({
  id,
  committee,
  positionId,
  groups,
  positions,
  disabled = false,
  disabledPositionId = "",
  placeholder = "Select an office and committee",
  onSelect,
}: CommitteeOfficePickerProps) {
  const office = officeForCommittee(committee)
  const selectedTitle = positions.find((position) => position.id === positionId)
    ?.title

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
            <span className={triggerCommitteeClasses}>
              {committee}
              {selectedTitle ? ` · ${selectedTitle}` : ""}
            </span>
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
                <CommitteeMenuRow
                  key={name}
                  committee={name}
                  selected={committee === name}
                  selectedPositionId={positionId}
                  disabledPositionId={disabledPositionId}
                  roles={positions.filter((position) => position.committee === name)}
                  onSelect={onSelect}
                />
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CommitteeMenuRow({
  committee,
  selected,
  selectedPositionId,
  disabledPositionId,
  roles,
  onSelect,
}: {
  committee: string
  selected: boolean
  selectedPositionId: string
  disabledPositionId: string
  roles: PositionOption[]
  onSelect: (next: { committee: string; positionId: string }) => void
}) {
  const onlyRole = roles.length === 1 ? roles[0] : null

  if (roles.length === 0) {
    return (
      <DropdownMenuItem disabled className={itemHoverClasses}>
        {committee}
      </DropdownMenuItem>
    )
  }

  if (onlyRole) {
    const taken = onlyRole.id === disabledPositionId
    return (
      <DropdownMenuItem
        disabled={taken}
        className={itemHoverClasses}
        onClick={() =>
          onSelect({ committee, positionId: onlyRole.id })
        }
      >
        <span className={committeeCopyClasses}>
          <span>{committee}</span>
          <span className={metaClasses}>{onlyRole.title}</span>
        </span>
        {selected ? <CheckIcon className={selectedIconClasses} /> : null}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(itemHoverClasses, selected && officeSelectedClasses)}
      >
        <span className={committeeCopyClasses}>
          <span>{committee}</span>
          <span className={metaClasses}>{roles.length} open roles</span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={subMenuClasses}>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.id}
            disabled={role.id === disabledPositionId}
            className={itemHoverClasses}
            onClick={() => onSelect({ committee, positionId: role.id })}
          >
            {role.title}
            {selectedPositionId === role.id ? (
              <CheckIcon className={selectedIconClasses} />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
