"use client";

import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZES = [10, 20, 50, 100, 500] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export function usePagination<T>(items: T[], initialSize: PageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(initialSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  return useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const start = (safePage - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    return {
      page: safePage,
      pageSize,
      pageCount,
      total,
      slice,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(start + pageSize, total),
      setPage,
      setPageSize: (size: PageSize) => {
        setPageSize(size);
        setPage(1);
      },
    };
  }, [items, page, pageCount, pageSize, total]);
}
