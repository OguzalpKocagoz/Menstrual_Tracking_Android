import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { ThemeProvider, useTheme } from "@/lib/theme";

function Navigator() {
  const { palette, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="hosgeldin" options={{ headerShown: false }} />
        <Stack.Screen name="gun/[date]" options={{ title: "Gün" }} />
        <Stack.Screen name="ayarlar" options={{ title: "Ayarlar" }} />
      </Stack>
    </>
  );
}

function ThemedApp() {
  const { settings } = useSettings();
  return (
    <ThemeProvider theme={settings.theme}>
      <Navigator />
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
