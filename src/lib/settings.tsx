import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME, isAppTheme, type AppTheme } from "@/core";
import { isLanguagePreference, type LanguagePreference } from "@/i18n/format";
import { readSettingsSync, writeSettingSync } from "./db";
import { DEFAULT_PILL_HOUR, DEFAULT_REMINDER_HOUR } from "./reminder-plan";

/**
 * Cihaz ayarları: tema, varsayılan uzunluklar ve tıbbi uyarının onayı.
 *
 * Hesap olmadığı için web'deki "profil"in yerini bu alır. Değerler SQLite'taki
 * `settings` tablosunda durur ve açılışta senkron okunur — tema ilk karede
 * doğru görünsün, uyarı ekranı yanlışlıkla bir an atlanmasın.
 */
export interface Settings {
  theme: AppTheme;
  /** "auto" telefonun dilini izler. */
  language: LanguagePreference;
  defaultCycleLength: number | null;
  defaultPeriodLength: number | null;
  /** Kullanıcı tıbbi uyarıyı onayladı mı. */
  disclaimerAccepted: boolean;
  /** Açılışta ve arka plandan dönüşte telefon kilidiyle doğrulama. */
  appLockEnabled: boolean;
  /** Adetten kaç gün önce hatırlatılsın; null → kapalı. */
  reminderPeriodDays: number | null;
  /** Doğurgan dönemin ilk günü hatırlatılsın mı. */
  reminderFertile: boolean;
  /** Döngü gözlemleri (klinik sınır karşılaştırması) gösterilsin mi. Varsayılan açık. */
  showInsights: boolean;
  /** Döngü hatırlatmalarının saati (0–23). Premium; ücretsizde sabit saat kullanılır. */
  reminderHour: number;
  /** Her gün aynı saatte hap hatırlatması. Premium. */
  pillReminder: boolean;
  pillHour: number;
  /**
   * Yalnızca geliştirme sürümünde: ödeme bağlanana kadar premium özellikleri
   * denemek için. Yayın sürümünde okunmaz (bkz. `premium.ts`).
   */
  devPremium: boolean;
}

export interface ReminderSchedule {
  reminderHour: number;
  pillReminder: boolean;
  pillHour: number;
}

const KEYS = {
  theme: "theme",
  language: "language",
  defaultCycleLength: "defaultCycleLength",
  defaultPeriodLength: "defaultPeriodLength",
  disclaimerAcceptedAt: "disclaimerAcceptedAt",
  appLockEnabled: "appLockEnabled",
  reminderPeriodDays: "reminderPeriodDays",
  reminderFertile: "reminderFertile",
  reminderHour: "reminderHour",
  pillReminder: "pillReminder",
  pillHour: "pillHour",
  devPremium: "devPremium",
  hideInsights: "hideInsights",
} as const;

function readNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function readHour(value: string | undefined, fallback: number): number {
  const hour = readNumber(value);
  return hour !== null && hour >= 0 && hour <= 23 ? hour : fallback;
}

function loadSettings(): Settings {
  const raw = readSettingsSync();
  const theme = raw[KEYS.theme];
  const language = raw[KEYS.language];
  return {
    theme: isAppTheme(theme) ? theme : DEFAULT_THEME,
    language: isLanguagePreference(language) ? language : "auto",
    defaultCycleLength: readNumber(raw[KEYS.defaultCycleLength]),
    defaultPeriodLength: readNumber(raw[KEYS.defaultPeriodLength]),
    disclaimerAccepted: Boolean(raw[KEYS.disclaimerAcceptedAt]),
    appLockEnabled: raw[KEYS.appLockEnabled] === "1",
    reminderPeriodDays: readNumber(raw[KEYS.reminderPeriodDays]),
    reminderFertile: raw[KEYS.reminderFertile] === "1",
    reminderHour: readHour(raw[KEYS.reminderHour], DEFAULT_REMINDER_HOUR),
    pillReminder: raw[KEYS.pillReminder] === "1",
    pillHour: readHour(raw[KEYS.pillHour], DEFAULT_PILL_HOUR),
    devPremium: raw[KEYS.devPremium] === "1",
    showInsights: raw[KEYS.hideInsights] !== "1",
  };
}

interface SettingsValue {
  settings: Settings;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: LanguagePreference) => void;
  setDefaultLengths: (cycle: number | null, period: number | null) => void;
  acceptDisclaimer: () => void;
  setAppLock: (enabled: boolean) => void;
  setReminders: (periodDays: number | null, fertile: boolean) => void;
  setReminderSchedule: (schedule: Partial<ReminderSchedule>) => void;
  setDevPremium: (enabled: boolean) => void;
  setShowInsights: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings);

  const setTheme = useCallback((theme: AppTheme) => {
    writeSettingSync(KEYS.theme, theme);
    setSettings((current) => ({ ...current, theme }));
  }, []);

  const setLanguage = useCallback((language: LanguagePreference) => {
    writeSettingSync(KEYS.language, language === "auto" ? null : language);
    setSettings((current) => ({ ...current, language }));
  }, []);

  const setDefaultLengths = useCallback((cycle: number | null, period: number | null) => {
    writeSettingSync(KEYS.defaultCycleLength, cycle === null ? null : String(cycle));
    writeSettingSync(KEYS.defaultPeriodLength, period === null ? null : String(period));
    setSettings((current) => ({ ...current, defaultCycleLength: cycle, defaultPeriodLength: period }));
  }, []);

  const acceptDisclaimer = useCallback(() => {
    // Onayın ne zaman verildiği saklanır; ileride metin değişirse yeniden
    // sormak için kullanılabilir.
    writeSettingSync(KEYS.disclaimerAcceptedAt, new Date().toISOString());
    setSettings((current) => ({ ...current, disclaimerAccepted: true }));
  }, []);

  const setAppLock = useCallback((enabled: boolean) => {
    writeSettingSync(KEYS.appLockEnabled, enabled ? "1" : null);
    setSettings((current) => ({ ...current, appLockEnabled: enabled }));
  }, []);

  const setReminders = useCallback((periodDays: number | null, fertile: boolean) => {
    writeSettingSync(KEYS.reminderPeriodDays, periodDays === null ? null : String(periodDays));
    writeSettingSync(KEYS.reminderFertile, fertile ? "1" : null);
    setSettings((current) => ({ ...current, reminderPeriodDays: periodDays, reminderFertile: fertile }));
  }, []);

  const setReminderSchedule = useCallback((schedule: Partial<ReminderSchedule>) => {
    if (schedule.reminderHour !== undefined) writeSettingSync(KEYS.reminderHour, String(schedule.reminderHour));
    if (schedule.pillReminder !== undefined) writeSettingSync(KEYS.pillReminder, schedule.pillReminder ? "1" : null);
    if (schedule.pillHour !== undefined) writeSettingSync(KEYS.pillHour, String(schedule.pillHour));
    setSettings((current) => ({ ...current, ...schedule }));
  }, []);

  const setDevPremium = useCallback((enabled: boolean) => {
    writeSettingSync(KEYS.devPremium, enabled ? "1" : null);
    setSettings((current) => ({ ...current, devPremium: enabled }));
  }, []);

  const setShowInsights = useCallback((show: boolean) => {
    writeSettingSync(KEYS.hideInsights, show ? null : "1");
    setSettings((current) => ({ ...current, showInsights: show }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setTheme,
      setLanguage,
      setDefaultLengths,
      acceptDisclaimer,
      setAppLock,
      setReminders,
      setReminderSchedule,
      setDevPremium,
      setShowInsights,
    }),
    [
      settings,
      setTheme,
      setLanguage,
      setDefaultLengths,
      acceptDisclaimer,
      setAppLock,
      setReminders,
      setReminderSchedule,
      setDevPremium,
      setShowInsights,
    ],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings, SettingsProvider içinde kullanılmalı.");
  return value;
}
