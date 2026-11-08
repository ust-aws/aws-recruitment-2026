"use client"

import { useState } from "react"
import ReactCrop, { type PercentCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import {
  cropCenter,
  cropToSquareFile,
  squareCropAt,
  type ImageSize,
  type PixelCrop,
} from "@/lib/apply/crop-image"

const contentClasses = "sm:max-w-md"
const cropAreaClasses = "mt-2 flex justify-center overflow-hidden rounded-[16px] bg-haiti"
// Show the whole photo; the square is dragged over it instead of the photo moving.
// ReactCrop's CSS gives the image `max-height: inherit`, so the cap goes on the wrapper.
const cropperClasses = "max-h-[55vh]"
const zoomRowClasses = "mt-4 flex items-center gap-3"
const zoomLabelClasses = "font-mono text-[10px] tracking-[0.14em] text-prelude"
const errorClasses = "mt-2 font-sans text-xs text-rose-glow"
const MIN_ZOOM = 1
const MAX_ZOOM = 3

type MemberPhotoCropDialogProps = {
  imageSrc: string
  fileName: string
  onCancel: () => void
  onCropped: (file: File) => void
}

function toPercent(crop: PixelCrop, image: ImageSize): PercentCrop {
  return {
    unit: "%",
    x: (crop.x / image.width) * 100,
    y: (crop.y / image.height) * 100,
    width: (crop.width / image.width) * 100,
    height: (crop.height / image.height) * 100,
  }
}

function toPixels(crop: PercentCrop, image: ImageSize): PixelCrop {
  return {
    x: (crop.x / 100) * image.width,
    y: (crop.y / 100) * image.height,
    width: (crop.width / 100) * image.width,
    height: (crop.height / 100) * image.height,
  }
}

/** Lets a member drag and resize a square over their photo before upload. */
export function MemberPhotoCropDialog({
  imageSrc,
  fileName,
  onCancel,
  onCropped,
}: MemberPhotoCropDialogProps) {
  const [image, setImage] = useState<ImageSize | null>(null)
  const [crop, setCrop] = useState<PixelCrop | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const zoom = image && crop ? Math.min(image.width, image.height) / crop.width : MIN_ZOOM

  function changeZoom(nextZoom: number) {
    if (!image || !crop) return
    setCrop(squareCropAt(image, nextZoom, cropCenter(crop)))
  }

  async function confirm() {
    if (!crop) return
    setPending(true)
    setError("")
    try {
      onCropped(await cropToSquareFile(imageSrc, crop, fileName))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not crop the photo.")
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onCancel() }}>
      <DialogContent className={contentClasses}>
        <DialogHeader>
          <DialogTitle>Adjust Your ID Photo</DialogTitle>
          <DialogDescription>Drag the square to frame your photo and use the slider to zoom.</DialogDescription>
        </DialogHeader>
        <div className={cropAreaClasses}>
          <ReactCrop
            className={cropperClasses}
            crop={image && crop ? toPercent(crop, image) : undefined}
            aspect={1}
            keepSelection
            onChange={(_, percent) => { if (image) setCrop(toPixels(percent, image)) }}
          >
            {/* Local object URLs can't go through next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Your upload, ready to crop"
              onLoad={(event) => {
                const size = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }
                setImage(size)
                setCrop(squareCropAt(size, MIN_ZOOM, { x: size.width / 2, y: size.height / 2 }))
              }}
            />
          </ReactCrop>
        </div>
        <div className={zoomRowClasses}>
          <span className={zoomLabelClasses}>ZOOM</span>
          <Slider
            aria-label="Zoom"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)}
            onValueChange={(value) => changeZoom(Array.isArray(value) ? value[0] : value)}
          />
        </div>
        {error ? <p className={errorClasses} role="alert">{error}</p> : null}
        <DialogFooter>
          <Button type="button" color="purple" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" color="cyan" disabled={pending || !crop} onClick={() => void confirm()}>
            {pending ? "Saving…" : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
