/** How a list of paid people can be ordered: its own order, or newest first by a date. */
export type DateSort = "default" | "verified" | "paid"

export const DATE_SORT_ORDER: DateSort[] = ["default", "verified", "paid"]

export const DATE_SORT_LABELS: Record<DateSort, string> = {
  default: "Default order",
  verified: "Newest verified",
  paid: "Newest paid",
}

/** Newest first; rows without that date keep their order at the end. */
export function newestFirst<T>(items: T[], dateOf: (item: T) => string | null): T[] {
  const time = (item: T) => {
    const date = dateOf(item)
    return date ? Date.parse(date) : 0
  }
  return [...items].sort((a, b) => time(b) - time(a))
}

/** The sort dropdown's options, each counting the rows that have that date. */
export function dateSortOptions<T>(items: T[], dates: Record<Exclude<DateSort, "default">, (item: T) => string | null>) {
  return DATE_SORT_ORDER.map((value) => ({
    value,
    label: DATE_SORT_LABELS[value],
    count: value === "default" ? items.length : items.filter((item) => dates[value](item) !== null).length,
  }))
}
