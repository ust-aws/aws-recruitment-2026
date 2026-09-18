import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const ERROR_COPY: Record<number, string> = {
  401: "Espi needs you to sign in first.",
  403: "Espi isn't allowed to let you through.",
  404: "Espi couldn't find that page.",
  500: "Espi hit turbulence in the cloud.",
}

const FALLBACK_COPY = "Espi ran into an unexpected error."

const shellClasses =
  "mx-auto flex min-h-svh w-full max-w-[1180px] flex-1 flex-col items-center justify-center px-4 py-8 md:px-10"
const rowClasses =
  "flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12"
const imageWrapClasses = "relative size-48 shrink-0 sm:size-56 md:size-64"
const copyClasses = "flex flex-col items-center text-center md:items-start md:text-left"
const headingClasses =
  "flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 font-sans text-5xl font-bold md:justify-start md:text-6xl"
const codeLabelClasses =
  "font-mono text-biloba-flower drop-shadow-[0_0_28px_rgba(183,140,240,0.55)]"
const codeNumberClasses =
  "text-aquamarine drop-shadow-[0_0_28px_rgba(90,240,192,0.5)]"
const messageClasses = "mt-3 max-w-sm font-sans text-base leading-relaxed text-prelude"
const asideClasses = "mt-2 font-sans text-sm text-prelude/70"
const actionsClasses = "mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start"
const buttonClasses = "h-10 px-5 text-xs"

type EspiErrorPageProps = {
  code: number
  retry?: () => void
}

export function EspiErrorPage({ code, retry }: EspiErrorPageProps) {
  const message = ERROR_COPY[code] ?? FALLBACK_COPY

  return (
    <main className={shellClasses}>
      <div className={rowClasses}>
        <div className={imageWrapClasses}>
          <Image
            src="/espi.png"
            alt="Espi, the AWS Builders – UST mascot"
            fill
            sizes="(min-width: 768px) 16rem, 14rem"
            className="object-contain"
            priority
          />
        </div>
        <div className={copyClasses}>
          <h1 className={headingClasses}>
            <span className={codeLabelClasses}>Error</span>
            <span className={codeNumberClasses}>{code}</span>
          </h1>
          <p className={messageClasses}>{message}</p>
          <p className={asideClasses}>That&apos;s all Espi knows.</p>
          <div className={actionsClasses}>
            <Button
              color="cyan"
              className={buttonClasses}
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back home
            </Button>
            {retry ? (
              <Button color="purple" className={buttonClasses} onClick={retry}>
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
