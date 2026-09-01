import en from "@/messages/en.json";
import ms from "@/messages/ms.json";

export const LOCALES = ["en", "ms"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_KEY = "x26_locale";

export const messages = { en, ms } as const;

export const localeTags: Record<Locale, string> = {
  en: "en-GB",
  ms: "ms-MY",
};

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ms";
}
