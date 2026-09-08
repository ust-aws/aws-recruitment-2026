"use client"

import { useEffect } from "react"
import { Poppins, JetBrains_Mono } from "next/font/google"
import { EspiErrorPage } from "@/components/espi-error-page"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
        <EspiErrorPage code={500} retry={retry} />
      </body>
    </html>
  )
}
