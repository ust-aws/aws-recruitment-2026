import { MotionShell } from "@/components/site/motion-shell"
import { NavigationMotionProvider } from "@/components/site/navigation-motion-provider"
import { SiteChrome } from "@/components/site/site-chrome"

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <NavigationMotionProvider>
      <MotionShell>
        <SiteChrome />
        {children}
      </MotionShell>
    </NavigationMotionProvider>
  )
}
