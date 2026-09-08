import { EspiErrorPage } from "@/components/espi-error-page"

export default function Unauthorized() {
  return <EspiErrorPage code={401} />
}
