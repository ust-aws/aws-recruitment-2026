import Image from "next/image"
import Link from "next/link"
import { SITE_NAV_ITEMS, SITE_SOCIAL_LINKS } from "@/lib/site/nav"

const footerClasses =
  "mt-auto border-t border-blue-chalk/10 bg-haiti/90"
const innerClasses =
  "mx-auto grid max-w-[1180px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:items-start md:gap-8 md:px-10"
const brandRowClasses = "flex items-center gap-3"
const brandNameClasses = "font-sans text-base font-bold text-blue-chalk"
const brandCopyClasses = "mt-4 font-mono text-xs leading-relaxed text-prelude"
const columnClasses = "flex flex-col gap-4"
const headingClasses =
  "font-sans text-sm font-bold uppercase tracking-wide text-blue-chalk"
const linkRowClasses = "flex flex-wrap gap-x-5 gap-y-2"
const linkClasses =
  "font-mono text-sm text-prelude transition-colors hover:text-blue-chalk"

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={footerClasses}>
      <div className={innerClasses}>
        <div>
          <div className={brandRowClasses}>
            <Image
              src="/aws-logo.png"
              alt=""
              width={117}
              height={66}
              className="h-9 w-auto"
            />
            <span className={brandNameClasses}>AWS Builders – UST</span>
          </div>
          <p className={brandCopyClasses}>
            Made with love by AWS Builders – UST
            <br />
            © {year}
          </p>
        </div>

        <div className={columnClasses}>
          <h2 className={headingClasses}>Sections</h2>
          <nav aria-label="Footer" className={linkRowClasses}>
            {SITE_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={linkClasses}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={columnClasses}>
          <h2 className={headingClasses}>Socials</h2>
          <nav aria-label="Social media" className={linkRowClasses}>
            {SITE_SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={linkClasses}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
