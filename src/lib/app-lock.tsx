import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { Body, Button, Title } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useSettings } from "./settings";
import { useTheme } from "./theme";

/**
 * Uygulama kilidi.
 *
 * Telefonun kendi kilidini kullanır (parmak izi, yüz ya da PIN/desen); ayrı bir
 * uygulama şifresi yoktur — unutulan ikinci bir şifre veriye erişimi kaybettirir.
 *
 * Uygulama açılırken ve arka planda `GRACE_MS`'den uzun kaldıktan sonra kilitlenir.
 * Kısa süre kuralı, sistemin PIN ekranı gibi doğrulamanın kendi açtığı
 * pencerelerin uygulamayı sonsuz döngüde yeniden kilitlemesini de önler.
 */
const GRACE_MS = 15_000;

export type LockAvailability = "ready" | "no-device-lock";

/** Telefonda bir ekran kilidi var mı; yoksa uygulama kilidi açılamaz. */
export async function checkLockAvailability(): Promise<LockAvailability> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level === LocalAuthentication.SecurityLevel.NONE ? "no-device-lock" : "ready";
}

export async function authenticate(promptMessage: string, cancelLabel: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    // PIN/desen yedeği açık: parmak izi okunmazsa kullanıcı dışarıda kalmasın.
    disableDeviceFallback: false,
  });
  return result.success;
}

export function AppLockGate({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { palette } = useTheme();
  const { t } = useI18n();
  const enabled = settings.appLockEnabled;
  const [locked, setLocked] = useState(enabled);
  const backgroundAt = useRef<number | null>(null);
  const authenticating = useRef(false);

  const unlock = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    try {
      if (await authenticate(t.lock.prompt, t.common.cancel)) setLocked(false);
    } finally {
      authenticating.current = false;
      backgroundAt.current = null;
    }
  }, [t]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (authenticating.current) return;
      if (state === "background") {
        backgroundAt.current = Date.now();
      } else if (state === "active" && backgroundAt.current !== null) {
        if (Date.now() - backgroundAt.current > GRACE_MS) setLocked(true);
        backgroundAt.current = null;
      }
    });
    return () => subscription.remove();
  }, [enabled]);

  // Kilit ekranı açılınca doğrulama kendiliğinden başlar.
  useEffect(() => {
    if (enabled && locked) void unlock();
  }, [enabled, locked, unlock]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {enabled && locked && (
        // Üstte örtü: altındaki ekranlar kapanmaz, kilit açılınca kaldığı yerden devam edilir.
        <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: palette.bg }]}>
          <Title>{t.common.appName}</Title>
          <Body muted center>
            {t.lock.locked}
          </Body>
          <Button label={t.lock.unlock} onPress={unlock} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
});
