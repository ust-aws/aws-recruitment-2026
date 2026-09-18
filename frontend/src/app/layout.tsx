import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ScrollToTop } from "@/components/site/scroll-to-top";
import { SiteFooterGate } from "@/components/site/site-footer-gate";
import { homeSplashSkipBootstrapScript } from "@/lib/site/home-splash";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWS Builders – UST",
  description: "The first cloud org at UST.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip bg-background text-foreground">
        <Script id="home-splash-bootstrap" strategy="beforeInteractive">
          {homeSplashSkipBootstrapScript()}
        </Script>
        <ScrollToTop />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooterGate />
      </body>
    </html>
  );
}
