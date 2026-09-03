import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const inputClasses =
  "glass h-10 w-full min-w-0 rounded-[14px] border border-blue-chalk/25 bg-haiti/40 px-3 py-2 font-sans text-sm text-blue-chalk outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-blue-chalk placeholder:text-prelude/70 focus-visible:border-aquamarine/50 focus-visible:ring-3 focus-visible:ring-aquamarine/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputClasses, className)}
      {...props}
    />
  )
}

export { Input }
