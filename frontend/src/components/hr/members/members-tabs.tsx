"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type MembersScope = "paid" | "unpaid"
export type MembersView = "list" | "committee"

const countClasses = "rounded-pill bg-blue-chalk/10 px-2 py-0.5 font-sans text-xs tabular-nums text-prelude"
const switchClasses = "w-full lg:w-fit"
const switchTriggerClasses = "flex-1 lg:flex-none"

export function MembersScopeTabs({
  scope,
  onScopeChange,
  paidCount,
  unpaidCount,
}: {
  scope: MembersScope
  onScopeChange: (scope: MembersScope) => void
  paidCount: number
  unpaidCount: number
}) {
  return (
    <Tabs value={scope} onValueChange={(next) => onScopeChange(next as MembersScope)} className="mt-8">
      <TabsList variant="line" aria-label="Which members">
        <TabsTrigger value="paid">
          Members <span className={countClasses}>{paidCount}</span>
        </TabsTrigger>
        <TabsTrigger value="unpaid">
          Not paid yet <span className={countClasses}>{unpaidCount}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function MembersViewSwitch({
  view,
  onViewChange,
}: {
  view: MembersView
  onViewChange: (view: MembersView) => void
}) {
  return (
    <Tabs value={view} onValueChange={(next) => onViewChange(next as MembersView)}>
      <TabsList aria-label="How to show the members" className={switchClasses}>
        <TabsTrigger value="list" className={switchTriggerClasses}>
          List
        </TabsTrigger>
        <TabsTrigger value="committee" className={switchTriggerClasses}>
          By committee
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
