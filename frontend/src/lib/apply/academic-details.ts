import { isValidSection } from "@/lib/apply/field-validation"

const YEAR_SUFFIXES = ["th", "st", "nd", "rd", "th", "th", "th"]

export function academicDetailsFromSection(section: string | null) {
  const normalized = section?.trim().toUpperCase() ?? ""
  if (!isValidSection(normalized)) return { yearLevel: null, course: null }

  const year = Number(normalized[0])
  return {
    yearLevel: `${year}${YEAR_SUFFIXES[year]} Year`,
    course: normalized.slice(1, 3),
  }
}
