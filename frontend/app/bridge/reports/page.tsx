"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError, api } from "@/lib/api";
import { useCrewSocket, type ReportSnapshot } from "@/lib/socket";
import { LevelBadge, StatusBadge } from "@/components/Badges";
import type { LevelReport, ResourceAnalytics } from "@/lib/types";

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const [byLevel, setByLevel] = useState<LevelReport[]>([]);
  const [resources, setResources] = useState<ResourceAnalytics[]>([]);
  const [highDemand, setHighDemand] = useState<ResourceAnalytics[]>([]);
  const [error, setError] = useState("");
  const { socket, live } = useCrewSocket();

  useEffect(() => {
    Promise.all([
      api<{ byLevel: LevelReport[] }>("/api/reports/by-level"),
      api<{
        resources: ResourceAnalytics[];
        highDemand: ResourceAnalytics[];
      }>("/api/reports/analytics"),
    ])
      .then(([levels, analytics]) => {
        setByLevel(levels.byLevel);
        setResources(analytics.resources);
        setHighDemand(analytics.highDemand);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t("loadFailed")),
      );
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onUpdate = (snapshot: ReportSnapshot) => {
      setByLevel(snapshot.byLevel);
      setResources(snapshot.resources);
      setHighDemand(snapshot.highDemand);
    };

    socket.on("reports:update", onUpdate);
    return () => {
      socket.off("reports:update", onUpdate);
    };
  }, [socket]);

  const peak = Math.max(1, ...resources.map((row) => row.allowedUses));

  return (
    <div className="stack">
      <p className="muted small" style={{ margin: 0 }}>
        <span className={live ? "badge badge-active" : "badge badge-retired"}>
          {live ? tCommon("live") : tCommon("offline")}
        </span>{" "}
        {t("liveHelp")}
      </p>
      {error ? <p className="error">{error}</p> : null}

      {highDemand.length > 0 ? (
        <div className="callout">
          <p className="kicker">{t("highDemand")}</p>
          <h2 style={{ marginTop: 8 }}>
            {highDemand.map((item) => item.name).join(", ")}
          </h2>
        </div>
      ) : null}

      <div>
        <h2 className="section-title">{t("byLevel")}</h2>
        <div className="grid-3">
          {byLevel.map((row) => (
            <div className="stat" key={row.level}>
              <LevelBadge level={row.level} />
              <b>{t("settlers", { count: row.passengerCount })}</b>
              <p className="muted small" style={{ margin: "8px 0 0" }}>
                {t("levelSummary", {
                  allowed: row.allowedCount,
                  denied: row.deniedCount,
                  resources: row.uniqueResourcesUsed,
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="section-title">{t("demand")}</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("rank")}</th>
                <th>{tCommon("resource")}</th>
                <th>{tCommon("minLevel")}</th>
                <th>{tCommon("status")}</th>
                <th>{t("allowedUses")}</th>
                <th>{t("passengers")}</th>
                <th>{t("load")}</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((row) => (
                <tr key={row.id}>
                  <td data-label={t("rank")} className="mono">
                    {row.demandRank}
                  </td>
                  <td data-label={tCommon("resource")}>{row.name}</td>
                  <td data-label={tCommon("minLevel")}>
                    <LevelBadge level={row.minLevel} />
                  </td>
                  <td data-label={tCommon("status")}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td data-label={t("allowedUses")}>{row.allowedUses}</td>
                  <td data-label={t("passengers")}>{row.uniquePassengers}</td>
                  <td data-label={t("load")}>
                    <div className="demand">
                      <span
                        style={{
                          width: `${(row.allowedUses / peak) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
