export const REVEAL_SECTION_EVENT = "aws-reveal-section"

export function requestSectionReveal(sectionId: string) {
  window.dispatchEvent(
    new CustomEvent(REVEAL_SECTION_EVENT, { detail: { sectionId } }),
  )
}
