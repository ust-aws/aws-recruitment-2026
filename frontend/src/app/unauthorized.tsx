import { EspiErrorPage } from "@/components/site/espi-error-page"

export default function Unauthorized() {
  return <EspiErrorPage code={401} />
}
