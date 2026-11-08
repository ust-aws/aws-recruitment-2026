import { code128Bars } from "@/lib/members/barcode"

type MemberIdBarcodeProps = {
  value: string
  className: string
}

// Scannable Code 128 of the member ID, drawn as plain SVG so it stays sharp
// at any card size. Bars use currentColor.
export function MemberIdBarcode({ value, className }: MemberIdBarcodeProps) {
  const { bars, modules } = code128Bars(value)
  if (modules === 0) return null

  return (
    <svg
      viewBox={`0 0 ${modules} 1`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={`Barcode for ${value}`}
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.width} height={1} fill="currentColor" />
      ))}
    </svg>
  )
}
