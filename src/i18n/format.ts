import { getDayOfMonth, getMonth, getYear, isUserError, type ISODate } from "@/core";
import type { Messages } from "./tr";

/**
 * Dile bağlı saf yardımcılar. React'e ve native modüllere bağlı değiller;
 * Node'da test edilebilsinler diye sağlayıcıdan (`index.tsx`) ayrı duruyorlar.
 */

export type Locale = "tr" | "en";
export type LanguagePreference = "auto" | Locale;

export const LOCALES: readonly Locale[] = ["tr", "en"];

/** Dil adları her dilde kendi dilinde yazılır; kullanıcı dilini tanıyabilsin. */
export const LOCALE_NAMES: Record<Locale, string> = { tr: "Türkçe", en: "English" };

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === "auto" || value === "tr" || value === "en";
}

/** Telefon dili Türkçe değilse İngilizce: en geniş kitleye hitap eden dil. */
export function resolveLocale(preference: LanguagePreference, deviceLanguage: string | null): Locale {
  if (preference !== "auto") return preference;
  return deviceLanguage === "tr" ? "tr" : "en";
}

export interface Formatters {
  /** "26 Kasım 2026" / "November 26, 2026" */
  date: (date: ISODate) => string;
  /** "26 Kasım" / "Nov 26" */
  shortDate: (date: ISODate) => string;
  /** "Kasım 2026" / "November 2026" */
  month: (year: number, month: number) => string;
  /** "yarın", "3 gün sonra" / "tomorrow", "in 3 days" */
  relativeDays: (days: number) => string;
}

export function createFormatters(t: Messages): Formatters {
  const monthName = (month: number) => t.dates.months[month - 1] ?? "";
  return {
    date: (date) => t.dates.long(getDayOfMonth(date), monthName(getMonth(date)), getYear(date)),
    shortDate: (date) => t.dates.short(getDayOfMonth(date), monthName(getMonth(date))),
    month: (year, month) => t.dates.monthYear(monthName(month), year),
    relativeDays: (days) => t.dates.relative(days),
  };
}

/**
 * Ekranda gösterilecek hata metni.
 *
 * Yalnızca bilerek fırlatılmış `UserError`'lar çevrilip gösterilir; beklenmeyen
 * bir arızanın (ör. SQLite) ham metni kullanıcıya çıkmaz.
 */
export function describeError(t: Messages, error: unknown, fallback: string = t.errors.unexpected): string {
  if (!isUserError(error)) return fallback;
  const { code, params } = error;
  switch (code) {
    case "periodTooLong":
      return t.errors.periodTooLong(params.max ?? 0);
    case "lengthRange":
      return t.errors.lengthRange(params.field ?? "cycleLength", params.min ?? 0, params.max ?? 0);
    default:
      return t.errors[code];
  }
}
