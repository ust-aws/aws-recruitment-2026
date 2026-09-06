import { EspiErrorPage } from "@/components/espi-error-page"

export default function Forbidden() {
  return <EspiErrorPage code={403} />
}
