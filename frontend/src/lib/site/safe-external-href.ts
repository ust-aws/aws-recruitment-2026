import {
  isValidFacebookUrl,
  isValidGithubUrl,
  isValidGoogleDriveUrl,
} from "@/lib/apply/field-validation"

export type ExternalLinkKind = "facebook" | "portfolio" | "github"

export function safeExternalHref(
  url: string | null | undefined,
  kind: ExternalLinkKind
): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (kind === "facebook" && isValidFacebookUrl(trimmed)) return trimmed
  if (kind === "portfolio" && isValidGoogleDriveUrl(trimmed)) return trimmed
  if (kind === "github" && isValidGithubUrl(trimmed)) return trimmed
  return null
}
