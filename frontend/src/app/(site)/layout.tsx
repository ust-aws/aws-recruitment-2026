import { SiteChrome } from "@/components/site-chrome"

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteChrome />
      {children}
    </>
  )
}
