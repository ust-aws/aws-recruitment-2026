export const APPLICATION_PAGE_SIZE = 10

export function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / APPLICATION_PAGE_SIZE))
}

export function pageSlice<T>(items: T[], page: number) {
  const start = (page - 1) * APPLICATION_PAGE_SIZE
  return items.slice(start, start + APPLICATION_PAGE_SIZE)
}

export function buildPageList(
  current: number,
  total: number
): (number | "ellipsis-leading" | "ellipsis-trailing")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: (number | "ellipsis-leading" | "ellipsis-trailing")[] = [1]

  if (current > 3) {
    pages.push("ellipsis-leading")
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (current < total - 2) {
    pages.push("ellipsis-trailing")
  }

  pages.push(total)
  return pages
}
