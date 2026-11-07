"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

/**
 * Computes the page numbers and ellipses to display.
 * When totalPages > 7 and near the start (e.g., 120 pages):
 * yields [1, 2, 3, 4, "...", 119, 120].
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If near the start (pages 1 to 4)
  // e.g. for 120 pages: [1, 2, 3, 4, "...", 119, 120]
  if (currentPage <= 4) {
    return [1, 2, 3, 4, "...", totalPages - 1, totalPages];
  }

  // If near the end (last 4 pages)
  // e.g. for 120 pages: [1, 2, "...", 117, 118, 119, 120]
  if (currentPage >= totalPages - 3) {
    return [
      1,
      2,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Middle range with ellipses on both sides
  // e.g. for page 50 of 120: [1, "...", 49, 50, 51, "...", 120]
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 25,
  onPageChange,
  itemLabel = "records",
  className = "",
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, safePage * itemsPerPage);

  const pageNumbers = getPaginationRange(safePage, totalPages);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 pt-4 border-t border-cream-200/80 w-full ${className}`}
    >
      {/* Record summary */}
      <div className="text-xs sm:text-sm text-navy-600 font-medium order-2 sm:order-1 text-center sm:text-left whitespace-nowrap">
        Showing{" "}
        <span className="font-bold text-navy-900 font-mono">{startItem}</span>{" "}
        to{" "}
        <span className="font-bold text-navy-900 font-mono">{endItem}</span> of{" "}
        <span className="font-bold text-navy-900 font-mono">{totalItems}</span>{" "}
        {itemLabel}
      </div>

      {/* Pagination Controls - Strictly single line on mobile and desktop */}
      <nav
        aria-label="Pagination"
        className="flex items-center justify-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-nowrap shrink-0 max-w-full overflow-x-auto no-scrollbar py-0.5"
      >
        {/* Previous Button - Icon-only on mobile, icon + text on desktop */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="Previous page"
          title="Previous page"
          className="inline-flex items-center justify-center gap-1 h-8 w-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-cream-200 text-navy-700 bg-white border-cream-200/90 hover:bg-saffron-50 hover:border-saffron-300 hover:text-navy-950 shadow-2xs cursor-pointer disabled:pointer-events-none shrink-0"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-nowrap shrink-0">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-5 sm:w-6 h-7.5 sm:h-8 flex items-center justify-center text-navy-400 text-xs font-medium select-none shrink-0"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrent = page === safePage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={isCurrent ? "page" : undefined}
                className={`min-w-7.5 h-7.5 sm:min-w-8 sm:h-8 px-1 sm:px-1.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 font-mono cursor-pointer shrink-0 ${
                  isCurrent
                    ? "bg-linear-to-r from-saffron-500 to-saffron-600 text-white shadow-xs border border-saffron-600 font-bold"
                    : "bg-white text-navy-700 border border-cream-200/90 hover:bg-saffron-50 hover:border-saffron-300 hover:text-navy-950"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button - Icon-only on mobile, icon + text on desktop */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          title="Next page"
          className="inline-flex items-center justify-center gap-1 h-8 w-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-cream-200 text-navy-700 bg-white border-cream-200/90 hover:bg-saffron-50 hover:border-saffron-300 hover:text-navy-950 shadow-2xs cursor-pointer disabled:pointer-events-none shrink-0"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
