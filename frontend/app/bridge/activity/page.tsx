"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/Pagination";
import { ApiError, api } from "@/lib/api";
import { usePagination } from "@/lib/pagination";
import { mergeActivity, useCrewSocket } from "@/lib/socket";
import { LevelBadge, OutcomeBadge, useFormatWhen } from "@/components/Badges";
import type { MembershipLevel, UsageOutcome, UsageRecord } from "@/lib/types";

const LEVELS: MembershipLevel[] = ["SILVER", "GOLD", "PLATINUM"];
const OUTCOMES: UsageOutcome[] = ["ALLOWED", "DENIED"];

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export default function ActivityPage() {
  const t = useTranslations("activity");
  const tCommon = useTranslations("common");
  const tLevels = useTranslations("levels");
  const tOutcome = useTranslations("outcome");
  const formatWhen = useFormatWhen();
  const [activity, setActivity] = useState<UsageRecord[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState({
    passenger: "",
    resource: "",
    level: "",
    outcome: "",
    session: "",
  });
  const { socket, live } = useCrewSocket();

  useEffect(() => {
    api<{ activity: UsageRecord[] }>("/api/usage/activity?limit=500")
      .then((data) => setActivity(data.activity))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t("loadFailed")),
      );
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onUpsert = (record: UsageRecord) => {
      setActivity((current) => mergeActivity(current, record));
    };

    socket.on("activity:upsert", onUpsert);
    return () => {
      socket.off("activity:upsert", onUpsert);
    };
  }, [socket]);

  const filtered = useMemo(
    () =>
      activity.filter((event) => {
        if (
          search.passenger &&
          !matches(event.passenger?.name ?? "", search.passenger)
        ) {
          return false;
        }
        if (search.resource && !matches(event.resource.name, search.resource)) {
          return false;
        }
        if (search.level && event.passenger?.level !== search.level) {
          return false;
        }
        if (search.outcome && event.outcome !== search.outcome) {
          return false;
        }
        if (search.session === "open" && event.endedAt) return false;
        if (search.session === "ended" && !event.endedAt) return false;
        return true;
      }),
    [activity, search],
  );
  const list = usePagination(filtered);

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-toolbar">
          <h2 className="section-title">{t("searchTitle")}</h2>
          <span className={live ? "badge badge-active" : "badge badge-retired"}>
            {live ? tCommon("live") : tCommon("offline")}
          </span>
        </div>
        <div className="row">
          <label className="field">
            <span>{tCommon("passenger")}</span>
            <input
              value={search.passenger}
              onChange={(e) =>
                setSearch({ ...search, passenger: e.target.value })
              }
              placeholder={t("searchPassenger")}
            />
          </label>
          <label className="field">
            <span>{tCommon("resource")}</span>
            <input
              value={search.resource}
              onChange={(e) =>
                setSearch({ ...search, resource: e.target.value })
              }
              placeholder={t("searchResource")}
            />
          </label>
          <label className="field">
            <span>{tCommon("level")}</span>
            <select
              value={search.level}
              onChange={(e) => setSearch({ ...search, level: e.target.value })}
            >
              <option value="">{tCommon("all")}</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {tLevels(level)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{tCommon("outcome")}</span>
            <select
              value={search.outcome}
              onChange={(e) => setSearch({ ...search, outcome: e.target.value })}
            >
              <option value="">{tCommon("all")}</option>
              {OUTCOMES.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {tOutcome(outcome)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{tCommon("session")}</span>
            <select
              value={search.session}
              onChange={(e) => setSearch({ ...search, session: e.target.value })}
            >
              <option value="">{tCommon("all")}</option>
              <option value="open">{tCommon("inUse")}</option>
              <option value="ended">{tCommon("ended")}</option>
            </select>
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
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

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{tCommon("when")}</th>
              <th>{tCommon("passenger")}</th>
              <th>{tCommon("level")}</th>
              <th>{tCommon("resource")}</th>
              <th>{tCommon("outcome")}</th>
              <th>{tCommon("ended")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td data-label="" colSpan={6} className="muted">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              list.slice.map((event) => (
                <tr key={event.id}>
                  <td data-label={tCommon("when")} className="mono">
                    {formatWhen(event.startedAt)}
                  </td>
                  <td data-label={tCommon("passenger")}>{event.passenger?.name}</td>
                  <td data-label={tCommon("level")}>
                    {event.passenger?.level ? (
                      <LevelBadge level={event.passenger.level} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label={tCommon("resource")}>{event.resource.name}</td>
                  <td data-label={tCommon("outcome")}>
                    <OutcomeBadge outcome={event.outcome} />
                  </td>
                  <td data-label={tCommon("ended")} className="mono">
                    {event.endedAt ? formatWhen(event.endedAt) : tCommon("inUse")}
                  </td>
                </tr>
              ))
            )}
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
