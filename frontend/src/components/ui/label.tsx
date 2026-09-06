"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const labelClasses =
  "flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-prelude select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(labelClasses, className)}
      {...props}
    />
  )
}

export { Label }
