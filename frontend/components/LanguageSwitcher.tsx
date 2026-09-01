"use client";

import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/components/I18nProvider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const { locale, setLocale } = useLocaleSwitch();

  return (
    <label className={compact ? "field lang-switch lang-switch-compact" : "field lang-switch"}>
      <span>{t("language")}</span>
      <select
        value={locale}
        aria-label={t("language")}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        <option value="en">{t("english")}</option>
        <option value="ms">{t("malay")}</option>
      </select>
    </label>
  );
}
