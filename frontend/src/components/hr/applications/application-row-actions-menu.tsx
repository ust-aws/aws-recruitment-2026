"use client"

import {
  Archive,
  Mail,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fullName } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { HrApplication } from "@/lib/types/hr-application"

const triggerClasses = cn(
  "inline-flex size-8 pointer-coarse:size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-blue-chalk/25 bg-haiti/45 p-0 text-prelude outline-none",
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
  "hover:border-biloba-flower/55 hover:bg-haiti/80 hover:text-blue-chalk",
  "focus-visible:border-biloba-flower/55 focus-visible:ring-2 focus-visible:ring-biloba-flower/40 focus-visible:ring-offset-0",
  "data-popup-open:border-biloba-flower/55 data-popup-open:bg-haiti/80 data-popup-open:text-blue-chalk",
  "active:scale-95 motion-reduce:active:scale-100",
)
const menuClasses =
  "min-w-[12.5rem] rounded-[14px] border border-blue-chalk/25 bg-haiti p-1 text-blue-chalk shadow-md ring-1 ring-blue-chalk/15"
const menuItemBaseClasses =
  "cursor-pointer gap-2 rounded-md px-2 py-2 font-sans text-sm transition-colors [&_svg]:transition-colors"
const itemClasses = cn(
  menuItemBaseClasses,
  "text-blue-chalk hover:bg-biloba-flower hover:text-haiti focus:bg-biloba-flower focus:text-haiti data-highlighted:bg-biloba-flower data-highlighted:text-haiti",
  "[&_svg]:text-prelude hover:[&_svg]:text-haiti data-highlighted:[&_svg]:text-haiti focus:[&_svg]:text-haiti",
)
const destructiveItemClasses = cn(
  menuItemBaseClasses,
  "text-rose-glow hover:bg-rose-deep/45 hover:text-white focus:bg-rose-deep/45 focus:text-white data-highlighted:bg-rose-deep/45 data-highlighted:text-white",
  "[&_svg]:text-rose-glow hover:[&_svg]:text-white data-highlighted:[&_svg]:text-white focus:[&_svg]:text-white",
)
const menuItemIconClasses =
  "size-4 shrink-0 pointer-events-none text-prelude transition-colors group-hover/dropdown-menu-item:text-haiti group-data-highlighted/dropdown-menu-item:text-haiti group-focus/dropdown-menu-item:text-haiti"
const destructiveMenuItemIconClasses =
  "size-4 shrink-0 pointer-events-none text-rose-glow transition-colors group-hover/dropdown-menu-item:text-white group-data-highlighted/dropdown-menu-item:text-white group-focus/dropdown-menu-item:text-white"
const triggerIconClasses = "size-4 shrink-0 pointer-events-none"

type ApplicationRowActionsMenuProps = {
  application: HrApplication
  onArchive: (application: HrApplication) => void
  onDelete?: (application: HrApplication) => void
  onEditEmail?: (application: HrApplication) => void
  onResendEmail?: (application: HrApplication) => void
}

export function ApplicationRowActionsMenu({
  application,
  onArchive,
  onDelete,
  onEditEmail,
  onResendEmail,
}: ApplicationRowActionsMenuProps) {
  const name = fullName(application)
  const archived = Boolean(application.archivedAt)
  const canResendEmail = Boolean(onResendEmail && application.canResendSubmittedEmail)
  const canManageEmail = Boolean(onEditEmail || canResendEmail)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={triggerClasses}
        aria-label={`Actions for ${name}`}
      >
        <MoreVertical className={triggerIconClasses} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className={menuClasses}>
        {canManageEmail ? (
          <>
            {onEditEmail ? (
              <DropdownMenuItem
                className={itemClasses}
                onClick={() => onEditEmail(application)}
              >
                <Pencil className={menuItemIconClasses} />
                Edit Email
              </DropdownMenuItem>
            ) : null}
            {canResendEmail && onResendEmail ? (
              <DropdownMenuItem
                className={itemClasses}
                onClick={() => onResendEmail(application)}
              >
                <Mail className={menuItemIconClasses} />
                Resend Success Email
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator className="bg-blue-chalk/15" />
          </>
        ) : null}
        <DropdownMenuItem
          className={archived ? itemClasses : destructiveItemClasses}
          onClick={() => onArchive(application)}
        >
          {archived ? (
            <RotateCcw className={menuItemIconClasses} />
          ) : (
            <Archive className={destructiveMenuItemIconClasses} />
          )}
          {archived ? "Restore Applicant" : "Archive Applicant"}
        </DropdownMenuItem>
        {archived && onDelete ? (
          <DropdownMenuItem
            className={destructiveItemClasses}
            onClick={() => onDelete(application)}
          >
            <Trash2 className={destructiveMenuItemIconClasses} />
            Delete Permanently
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
