import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Body, Button, Card, Screen, Title } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useSettings } from "@/lib/settings";
import { useTheme } from "@/lib/theme";

/** İlk açılış: tıbbi uyarı onaylanmadan uygulamaya geçilmez. */
export default function WelcomeScreen() {
  const router = useRouter();
  const { settings, acceptDisclaimer } = useSettings();
  const { palette } = useTheme();
  const { t } = useI18n();
  const [accepted, setAccepted] = useState(false);

  if (settings.disclaimerAccepted) return <Redirect href="/" />;

  function start() {
    acceptDisclaimer();
    router.replace("/");
  }

  return (
    <Screen>
      <View style={{ height: 32 }} />
      <Title>{t.common.appName}</Title>
      <Body muted>{t.welcome.tagline}</Body>

      <Card>
        <Body>{t.disclaimer}</Body>
        <Body muted>{t.welcome.localData}</Body>

        <Pressable
          onPress={() => setAccepted((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: accepted ? palette.brand : palette.border,
              backgroundColor: accepted ? palette.brand : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {accepted && <Text style={{ color: palette.onBrand, fontWeight: "700" }}>✓</Text>}
          </View>
          <Text style={{ color: palette.text, flex: 1 }}>{t.welcome.understood}</Text>
        </Pressable>

        <Button label={t.welcome.start} onPress={start} disabled={!accepted} />
      </Card>
    </Screen>
  );
}
