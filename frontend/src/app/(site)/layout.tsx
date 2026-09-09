import { MotionShell } from "@/components/motion-shell"
import { NavigationMotionProvider } from "@/components/navigation-motion-provider"
import { SiteChrome } from "@/components/site-chrome"

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
