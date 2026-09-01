"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/Pagination";
import { ApiError, api } from "@/lib/api";
import { usePagination } from "@/lib/pagination";
import { LevelBadge, OutcomeBadge, useFormatWhen } from "@/components/Badges";
import type { UsageRecord } from "@/lib/types";

export default function HistoryPage() {
  const t = useTranslations("history");
  const tCommon = useTranslations("common");
  const formatWhen = useFormatWhen();
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ history: UsageRecord[] }>("/api/usage/me")
      .then((data) => setHistory(data.history))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t("loadFailed")),
      );
  }, []);

  const allowed = history.filter((event) => event.outcome === "ALLOWED").length;
  const list = usePagination(history);

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="stat">
          <span className="muted small">{t("events")}</span>
          <b>{history.length}</b>
        </div>
        <div className="stat">
          <span className="muted small">{t("allowedUses")}</span>
          <b>{allowed}</b>
        </div>
        <div className="stat">
          <span className="muted small">{t("denied")}</span>
          <b>{history.length - allowed}</b>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tCommon("when")}</th>
              <th>{tCommon("resource")}</th>
              <th>{tCommon("minLevel")}</th>
              <th>{tCommon("outcome")}</th>
              <th>{tCommon("ended")}</th>
            </tr>
          </thead>
          <tbody>
            {list.slice.map((event) => (
              <tr key={event.id}>
                <td data-label={tCommon("when")} className="mono">
                  {formatWhen(event.startedAt)}
                </td>
                <td data-label={tCommon("resource")}>{event.resource.name}</td>
                <td data-label={tCommon("minLevel")}>
                  <LevelBadge level={event.resource.minLevel} />
                </td>
                <td data-label={tCommon("outcome")}>
                  <OutcomeBadge outcome={event.outcome} />
                </td>
                <td data-label={tCommon("ended")} className="mono">
                  {event.endedAt ? formatWhen(event.endedAt) : tCommon("inUse")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={list.page}
        pageCount={list.pageCount}
        pageSize={list.pageSize}
        total={list.total}
        from={list.from}
        to={list.to}
        onPage={list.setPage}
        onPageSize={list.setPageSize}
      />
    </div>
  );
}
