import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME, isAppTheme, type AppTheme } from "@/core";
import { readSettingsSync, writeSettingSync } from "./db";

/**
 * Cihaz ayarları: tema, varsayılan uzunluklar ve tıbbi uyarının onayı.
 *
 * Hesap olmadığı için web'deki "profil"in yerini bu alır. Değerler SQLite'taki
 * `settings` tablosunda durur ve açılışta senkron okunur — tema ilk karede
 * doğru görünsün, uyarı ekranı yanlışlıkla bir an atlanmasın.
 */
export interface Settings {
  theme: AppTheme;
  defaultCycleLength: number | null;
  defaultPeriodLength: number | null;
  /** Kullanıcı tıbbi uyarıyı onayladı mı. */
  disclaimerAccepted: boolean;
}

const KEYS = {
  theme: "theme",
  defaultCycleLength: "defaultCycleLength",
  defaultPeriodLength: "defaultPeriodLength",
  disclaimerAcceptedAt: "disclaimerAcceptedAt",
} as const;

function readNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function loadSettings(): Settings {
  const raw = readSettingsSync();
  const theme = raw[KEYS.theme];
  return {
    theme: isAppTheme(theme) ? theme : DEFAULT_THEME,
    defaultCycleLength: readNumber(raw[KEYS.defaultCycleLength]),
    defaultPeriodLength: readNumber(raw[KEYS.defaultPeriodLength]),
    disclaimerAccepted: Boolean(raw[KEYS.disclaimerAcceptedAt]),
  };
}

interface SettingsValue {
  settings: Settings;
  setTheme: (theme: AppTheme) => void;
  setDefaultLengths: (cycle: number | null, period: number | null) => void;
  acceptDisclaimer: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings);

  const setTheme = useCallback((theme: AppTheme) => {
    writeSettingSync(KEYS.theme, theme);
    setSettings((current) => ({ ...current, theme }));
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

  const value = useMemo(
    () => ({ settings, setTheme, setDefaultLengths, acceptDisclaimer }),
    [settings, setTheme, setDefaultLengths, acceptDisclaimer],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings, SettingsProvider içinde kullanılmalı.");
  return value;
}
