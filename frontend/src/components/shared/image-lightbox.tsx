"use client"

import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const triggerButtonClasses =
  "cursor-pointer border-0 bg-transparent p-0 text-left"
const contentClasses =
  "max-w-[min(96vw,56rem)] gap-3 overflow-hidden border-blue-chalk/25 p-3 pt-4 sm:gap-4 sm:p-4 sm:pt-5"
const headerClasses = "w-full shrink-0 px-9 sm:px-10"
const titleClasses =
  "text-center text-base leading-snug text-blue-chalk line-clamp-3 sm:text-lg"
const imageWrapClasses =
  "flex min-h-0 w-full justify-center overflow-hidden"
const imageClasses =
  "max-h-[min(80vh,40rem)] w-auto max-w-full object-contain"

type ImageLightboxProps = {
  src: string
  alt: string
  title: string
  description?: string
  unoptimized?: boolean
  triggerClassName?: string
  triggerAriaLabel: string
  onTriggerPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

export function ImageLightbox({
  src,
  alt,
  title,
  description = "Full-size photo",
  unoptimized = false,
  triggerClassName,
  triggerAriaLabel,
  onTriggerPointerDown,
  children,
}: ImageLightboxProps) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(triggerButtonClasses, triggerClassName)}
        aria-label={triggerAriaLabel}
        onPointerDown={onTriggerPointerDown}
      >
        {children}
      </DialogTrigger>
      <DialogContent className={contentClasses}>
        <div className={headerClasses}>
          <DialogTitle className={titleClasses}>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </div>
        <div className={imageWrapClasses}>
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            className={imageClasses}
            unoptimized={unoptimized}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
