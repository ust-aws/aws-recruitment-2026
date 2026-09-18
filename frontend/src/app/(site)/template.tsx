import dynamic from "next/dynamic"

const PageTransition = dynamic(() =>
  import("@/components/site/page-transition").then((mod) => mod.PageTransition),
)

export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
