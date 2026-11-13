export function hrApplicationListNoticeFeedback(notice?: string) {
  if (notice === "added") {
    return { type: "success" as const, message: "Applicant added." }
  }
  if (notice === "archived") {
    return { type: "success" as const, message: "Applicant archived." }
  }
  if (notice === "restored") {
    return { type: "success" as const, message: "Applicant restored." }
  }
  if (notice === "deleted") {
    return {
      type: "success" as const,
      message: "Applicant deleted. Their interview slot is now open.",
    }
  }
  return null
}
