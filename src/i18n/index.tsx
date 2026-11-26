import { useLocales } from "expo-localization";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { en } from "./en";
import {
  createFormatters,
  describeError,
  resolveLocale,
  type Formatters,
  type LanguagePreference,
  type Locale,
} from "./format";
import { tr, type Messages } from "./tr";

/**
 * Çoklu dil.
 *
 * Dil seçimi ayarlardan gelir: "auto" telefonun dilini izler (Türkçe ise
 * Türkçe, diğer her dilde İngilizce), ya da kullanıcı elle seçer. Metinler
 * `tr.ts`/`en.ts`'teki tip güvenli sözlüklerden okunur.
 */

export const DICTIONARIES: Record<Locale, Messages> = { tr, en };

interface I18nValue {
  locale: Locale;
  t: Messages;
  format: Formatters;
  /** Hata nesnesini seçili dilde metne çevirir. */
  errorText: (error: unknown, fallback?: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ preference, children }: { preference: LanguagePreference; children: ReactNode }) {
  // Telefon dili değişince (Android'de uygulama açıkken de olabilir) yeniden çizilir.
  const deviceLanguage = useLocales()[0]?.languageCode ?? null;
  const locale = resolveLocale(preference, deviceLanguage);

  const value = useMemo<I18nValue>(() => {
    const t = DICTIONARIES[locale];
    return {
      locale,
      t,
      format: createFormatters(t),
      errorText: (error, fallback) => describeError(t, error, fallback),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
}

export * from "./format";
export type { Messages };
