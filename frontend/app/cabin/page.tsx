"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError, api } from "@/lib/api";
import { LevelBadge, useFormatWhen } from "@/components/Badges";
import { useAuth } from "@/components/AuthProvider";
import type { MembershipLevel, Resource, UsageRecord } from "@/lib/types";

export default function CabinResourcesPage() {
  const { user } = useAuth();
  const t = useTranslations("cabin");
  const formatWhen = useFormatWhen();
  const [resources, setResources] = useState<Resource[]>([]);
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [level, setLevel] = useState<MembershipLevel | null>(user?.level ?? null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const [available, mine] = await Promise.all([
      api<{ level: MembershipLevel; resources: Resource[] }>(
        "/api/resources/available",
      ),
      api<{ history: UsageRecord[] }>("/api/usage/me"),
    ]);
    setResources(available.resources);
    setLevel(available.level);
    setHistory(mine.history);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : t("loadFailed")),
    );
  }, []);

  const openByResource = useMemo(() => {
    const map = new Map<string, UsageRecord>();
    for (const event of history) {
      if (event.outcome === "ALLOWED" && !event.endedAt) {
        map.set(event.resource.id, event);
      }
    }
    return map;
  }, [history]);

  async function useResource(id: string) {
    setError("");
    setBusyId(id);
    try {
      await api(`/api/resources/${id}/use`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("useFailed"));
      await load().catch(() => undefined);
    } finally {
      setBusyId(null);
    }
  }

  async function endSession(eventId: string, resourceId: string) {
    setError("");
    setBusyId(resourceId);
    try {
      await api(`/api/usage/${eventId}/end`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("endFailed"));
      await load().catch(() => undefined);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack">
      <div className="panel panel-split">
        <div>
          <p className="kicker">{t("membership")}</p>
          <h2 style={{ marginTop: 8 }}>{user?.name}</h2>
        </div>
        {level ? <LevelBadge level={level} /> : null}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="grid-cards">
        {resources.map((resource) => {
          const open = openByResource.get(resource.id);
          return (
            <article className="panel stack" key={resource.id}>
              <div>
                <p className="kicker">{resource.family}</p>
                <h2 style={{ marginTop: 8 }}>{resource.name}</h2>
              </div>
              <LevelBadge level={resource.minLevel} />
              {open ? (
                <>
                  <p className="muted small" style={{ margin: 0 }}>
                    {t("inUseSince", { when: formatWhen(open.startedAt) })}
                  </p>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={busyId === resource.id}
                    onClick={() => endSession(open.id, resource.id)}
                  >
                    {t("endSession")}
                  </button>
                </>
              ) : (
                <button
                  className="btn"
                  type="button"
                  disabled={busyId === resource.id}
                  onClick={() => useResource(resource.id)}
                >
                  {t("useResource")}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
