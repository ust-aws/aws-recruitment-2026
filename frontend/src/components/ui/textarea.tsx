import * as React from "react"

import { cn } from "@/lib/utils"

const textareaClasses =
  "flex field-sizing-content min-h-20 w-full rounded-[14px] border border-blue-chalk/25 bg-haiti/40 px-3 py-2 font-sans text-sm text-blue-chalk transition-colors outline-none placeholder:text-prelude/60 focus-visible:border-biloba-flower focus-visible:ring-3 focus-visible:ring-biloba-flower/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaClasses, className)}
      {...props}
    />
  )
}

export { Textarea }
