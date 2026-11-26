import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NightSky } from "@/components/night-sky";
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
        <Stack.Screen name="gun/[date]" options={{ title: "Gün" }} />
        <Stack.Screen name="ayarlar" options={{ title: "Ayarlar" }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

function ThemedApp() {
  const { settings } = useSettings();
  return (
    <ThemeProvider theme={settings.theme}>
      <View style={{ flex: 1 }}>
        <NightSky />
        <AppLockGate>
          <Navigator />
        </AppLockGate>
      </View>
      {settings.disclaimerAccepted && <ReminderSync />}
    </ThemeProvider>
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
