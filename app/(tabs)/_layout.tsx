import { Redirect, Tabs, useRouter } from "expo-router";
import { Pressable, Text, type ColorValue } from "react-native";
import { useI18n } from "@/i18n";
import { useSettings } from "@/lib/settings";
import { useTheme } from "@/lib/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

/**
 * Alt gezinme: Bugün · Takvim · Doğurganlık · İstatistik
 *
 * Tıbbi uyarı onaylanmadan sekmelere geçilmez.
 */
export default function TabLayout() {
  const { settings } = useSettings();
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  if (!settings.disclaimerAccepted) return <Redirect href="/hosgeldin" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.chrome },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: { backgroundColor: palette.chrome, borderTopColor: palette.border },
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.textMuted,
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/ayarlar")}
            hitSlop={10}
            style={{ paddingHorizontal: 16 }}
            accessibilityLabel={t.tabs.settings}
          >
            <Text style={{ fontSize: 20, color: palette.text }}>⚙︎</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t.tabs.today, tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} /> }}
      />
      <Tabs.Screen
        name="takvim"
        options={{ title: t.tabs.calendar, tabBarIcon: ({ color }) => <TabIcon glyph="▦" color={color} /> }}
      />
      <Tabs.Screen
        name="dogurganlik"
        options={{
          title: t.tabs.fertility,
          tabBarIcon: ({ color }) => <TabIcon glyph="✿" color={color} />,
        }}
      />
      <Tabs.Screen
        name="istatistik"
        options={{
          title: t.tabs.stats,
          tabBarIcon: ({ color }) => <TabIcon glyph="▤" color={color} />,
        }}
      />
    </Tabs>
  );
}
