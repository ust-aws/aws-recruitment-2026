"use client"

import { useEffect } from "react"
import { EspiErrorPage } from "@/components/site/espi-error-page"

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <EspiErrorPage code={500} retry={retry} />
}
