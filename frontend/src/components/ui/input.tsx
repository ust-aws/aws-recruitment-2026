import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const inputClasses =
  "h-9 w-full min-w-0 rounded-[14px] border border-blue-chalk/25 bg-haiti/40 px-3 py-2 font-sans text-sm text-blue-chalk transition-colors outline-none placeholder:text-prelude/60 focus-visible:border-biloba-flower focus-visible:ring-3 focus-visible:ring-biloba-flower/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"

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
