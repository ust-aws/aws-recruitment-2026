"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // Pill group on a tinted track.
        default: "gap-1 rounded-pill bg-meteorite/40 p-1",
        // Plain labels on a hairline, the active one underlined (dashboard scope tabs).
        // Scrolls sideways when the labels don't fit on a phone.
        line: "w-full gap-6 overflow-x-auto border-b border-blue-chalk/15 [scrollbar-width:none]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

const tabTriggerClasses = [
  "relative inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap px-1 font-sans text-sm font-medium text-prelude outline-none transition-colors",
  "hover:text-blue-chalk focus-visible:ring-2 focus-visible:ring-aquamarine/60 data-active:text-blue-chalk",
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  // The underline sits on the list's hairline, inside it so a scrolling list doesn't clip it.
  "group-data-[variant=line]/tabs-list:focus-visible:ring-inset",
  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-chalk after:opacity-0 after:transition-opacity data-active:after:opacity-100",
  "group-data-[variant=default]/tabs-list:rounded-pill group-data-[variant=default]/tabs-list:px-4 group-data-[variant=default]/tabs-list:after:hidden group-data-[variant=default]/tabs-list:data-active:bg-daisy-bush/60",
].join(" ")

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabTriggerClasses, className)}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
