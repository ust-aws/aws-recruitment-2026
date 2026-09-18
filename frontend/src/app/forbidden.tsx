import { EspiErrorPage } from "@/components/site/espi-error-page"

export default function Forbidden() {
  return <EspiErrorPage code={403} />
}
