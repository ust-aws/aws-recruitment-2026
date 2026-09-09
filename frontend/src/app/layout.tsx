import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SiteFooterGate } from "@/components/site-footer-gate";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip bg-background text-foreground">
        <ScrollToTop />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooterGate />
      </body>
    </html>
  );
}
