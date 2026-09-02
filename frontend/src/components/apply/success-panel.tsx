import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { glassPanelClasses } from "@/lib/surface"

const wrapClasses = "mx-auto flex w-full max-w-xl flex-col items-center pt-6"
const panelClasses = `${glassPanelClasses} flex flex-col items-center px-8 py-12 text-center`
const checkWrapClasses =
  "mb-5 flex size-12 items-center justify-center rounded-full bg-biloba-flower text-haiti"
const titleClasses = "font-sans text-2xl font-bold text-blue-chalk md:text-3xl"
const bodyClasses = "mt-3 max-w-sm font-sans text-sm leading-relaxed text-prelude"
const buttonClasses = "mt-8 h-10 px-5 text-xs"

export function SuccessPanel() {
  return (
    <div className={wrapClasses}>
      <div className={panelClasses}>
        <div className={checkWrapClasses}>
          <Check className="size-6" strokeWidth={3} />
        </div>
        <h2 className={titleClasses}>Application submitted!</h2>
        <p className={bodyClasses}>
          Thanks for applying to AWS Builders - UST! We&apos;ll reach out once
          R101 review wraps up.
        </p>
        <Button color="purple" className={buttonClasses} nativeButton={false} render={<Link href="/apply/positions" />}>
          Browse open positions
        </Button>
      </div>
    </div>
  )
}
