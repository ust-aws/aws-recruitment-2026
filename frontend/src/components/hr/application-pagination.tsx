"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  APPLICATION_PAGE_SIZE,
  buildPageList,
  pageCount,
} from "@/components/hr/application-pagination-utils"

const footerClasses =
  "mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between"
const summaryClasses = "font-mono text-xs tracking-wide text-prelude"

type ApplicationPaginationProps = {
  total: number
  page: number
  onPageChange: (page: number) => void
}

export function ApplicationPagination({
  total,
  page,
  onPageChange,
}: ApplicationPaginationProps) {
  const totalPages = pageCount(total)
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * APPLICATION_PAGE_SIZE + 1
  const end = Math.min(safePage * APPLICATION_PAGE_SIZE, total)
  const pages = buildPageList(safePage, totalPages)

  if (total === 0) {
    return null
  }

  return (
    <div className={footerClasses}>
      <p className={summaryClasses}>
        Showing {start}–{end} of {total} applications
      </p>

      {totalPages > 1 ? (
        <Pagination className="sm:mx-0 sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={safePage <= 1}
                onClick={() => onPageChange(safePage - 1)}
              />
            </PaginationItem>

            {pages.map((entry) =>
              typeof entry === "string" ? (
                <PaginationItem key={entry}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={entry}>
                  <PaginationLink
                    isActive={entry === safePage}
                    onClick={() => onPageChange(entry)}
                  >
                    {entry}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                disabled={safePage >= totalPages}
                onClick={() => onPageChange(safePage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
