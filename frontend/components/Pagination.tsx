"use client";

import { useTranslations } from "next-intl";
import { PAGE_SIZES, type PageSize } from "@/lib/pagination";

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  from,
  to,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: PageSize;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
  onPageSize: (size: PageSize) => void;
}) {
  const t = useTranslations("pager");

  return (
    <div className="pager">
      <p className="muted small pager-meta">
        {total === 0 ? t("none") : t("showing", { from, to, total })}
      </p>
      <label className="field pager-size">
        <span>{t("perPage")}</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value) as PageSize)}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="pager-nav">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t("previous")}
        </button>
        <span className="muted small">{t("pageOf", { page, pageCount })}</span>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}
