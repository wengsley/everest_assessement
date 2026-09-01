"use client";

import { useLocale, useTranslations } from "next-intl";
import { localeTags, type Locale } from "@/lib/i18n";
import type { MembershipLevel } from "@/lib/types";

export function LevelBadge({ level }: { level: MembershipLevel }) {
  const t = useTranslations("levels");
  return <span className={`badge badge-${level.toLowerCase()}`}>{t(level)}</span>;
}

export function StatusBadge({
  status,
}: {
  status: "ACTIVE" | "DECOMMISSIONED";
}) {
  const t = useTranslations("status");
  return (
    <span
      className={
        status === "ACTIVE" ? "badge badge-active" : "badge badge-retired"
      }
    >
      {t(status)}
    </span>
  );
}

export function OutcomeBadge({
  outcome,
}: {
  outcome: "ALLOWED" | "DENIED";
}) {
  const t = useTranslations("outcome");
  return (
    <span
      className={
        outcome === "ALLOWED" ? "badge badge-active" : "badge badge-denied"
      }
    >
      {t(outcome)}
    </span>
  );
}

export function formatWhen(iso: string, locale: Locale = "en") {
  return new Date(iso).toLocaleString(localeTags[locale], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useFormatWhen() {
  const locale = useLocale() as Locale;
  return (iso: string) => formatWhen(iso, locale);
}
