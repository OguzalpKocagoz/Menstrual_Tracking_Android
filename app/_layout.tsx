import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NightSky } from "@/components/night-sky";
import { DEFAULT_THEME, PREMIUM_THEMES } from "@/core";
import { AdsProvider } from "@/lib/ads";
import { usePremium } from "@/lib/premium";
import { I18nProvider, useI18n } from "@/i18n";
import { AppLockGate } from "@/lib/app-lock";
import { ReminderSync } from "@/lib/reminder-sync";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { ThemeProvider, useTheme } from "@/lib/theme";

/**
 * Gökyüzü bütün ekranların arkasında tek bir katman olarak durur; ekranlar ve
 * gezinme kapları şeffaf. Böylece ekran geçişlerinde gökyüzü yeniden
 * çizilmez, yıldızlar ve kayan şekiller kesintisiz akmaya devam eder.
 */
function Navigator() {
  const { palette } = useTheme();
  const { t } = useI18n();

  // Gezinme kitaplığının kendi zemin rengi kapları boyar; şeffaf yapılmazsa
  // gökyüzü ekranların arkasında kalır.
  const navigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: "transparent",
        card: palette.chrome,
        text: palette.text,
        border: palette.border,
        primary: palette.brand,
      },
    }),
    [palette],
  );

  // Kök pencere rengi: klavye açılırken ve geçişlerde bir anlığına beyaz
  // görünmesin.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.bg);
  }, [palette.bg]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.chrome },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="hosgeldin" options={{ headerShown: false }} />
        <Stack.Screen name="gun/[date]" options={{ title: t.tabs.day }} />
        <Stack.Screen name="ayarlar" options={{ title: t.tabs.settings }} />
        <Stack.Screen name="tahmin" options={{ title: t.method.title }} />
        <Stack.Screen name="premium" options={{ title: t.settings.premiumTitle, presentation: "modal" }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

function ThemedApp() {
  const { settings } = useSettings();
  const { featuresUnlocked } = usePremium();
  // Premium tema, özellik kilitliyse uygulanmaz; seçim silinmez, kilit
  // açılınca geri gelir.
  const theme = !featuresUnlocked && PREMIUM_THEMES.includes(settings.theme) ? DEFAULT_THEME : settings.theme;
  return (
    <I18nProvider preference={settings.language}>
    <ThemeProvider theme={theme}>
      <View style={{ flex: 1 }}>
        <NightSky />
        <AppLockGate>
          {/* Reklam rızası, tıbbi uyarı onaylanmadan sorulmaz: ilk açılışta
              kullanıcının karşısına önce uygulamanın kendisi çıksın. */}
          <AdsProvider enabled={settings.disclaimerAccepted}>
            <Navigator />
          </AdsProvider>
        </AppLockGate>
      </View>
      {settings.disclaimerAccepted && <ReminderSync />}
    </ThemeProvider>
    </I18nProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Veri telefonda; ağ yok. Başarısız okuma tekrar denense de sonuç değişmez.
        defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <ThemedApp />
        </SettingsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
