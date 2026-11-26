import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ShapeGlyph } from "@/components/night-sky";
import { Body, Button, Card, Heading, Screen, Title } from "@/components/ui";
import { useI18n } from "@/i18n";
import { usePremium } from "@/lib/premium";
import { useTheme } from "@/lib/theme";

type Plan = "monthly" | "yearly";

/**
 * Premium ekranı (paywall).
 *
 * Satın alma Google Play Billing (RevenueCat) bağlanınca açılacak. O zamana
 * kadar düğme pasif ve fiyatlar mağazadan gelmediği için gösterilmiyor —
 * uydurma bir fiyat yazıp sonra değiştirmek, mağaza incelemesinde "yanıltıcı
 * fiyat" sayılabilir.
 */
export default function PremiumScreen() {
  const { t } = useI18n();
  const { palette, sky } = useTheme();
  const { isPremium } = usePremium();
  const [plan, setPlan] = useState<Plan>("yearly");

  return (
    <Screen edges={[]}>
      <View style={{ alignItems: "center", gap: 8, paddingTop: 8 }}>
        <ShapeGlyph shape={sky.shapes[0] ?? "sparkle"} color={sky.shapeColor} size={44} />
        <Title>{t.premium.title}</Title>
        <Body muted center>
          {t.premium.subtitle}
        </Body>
      </View>

      <Card>
        {t.premium.features.map((feature) => (
          <View key={feature.title} style={{ flexDirection: "row", gap: 12 }}>
            <Text style={{ color: palette.brand, fontSize: 18, lineHeight: 22 }}>✦</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Heading>{feature.title}</Heading>
              <Body muted>{feature.body}</Body>
            </View>
          </View>
        ))}
      </Card>

      {isPremium ? (
        <Card>
          <Body center>{t.premium.active}</Body>
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(["monthly", "yearly"] as const).map((option) => {
              const selected = plan === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setPlan(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={{
                    flex: 1,
                    padding: 14,
                    gap: 4,
                    borderRadius: 16,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? palette.brand : palette.border,
                    backgroundColor: selected ? palette.brandSoft : palette.surface,
                  }}
                >
                  {option === "yearly" && (
                    <Text style={{ color: palette.brand, fontSize: 12, fontWeight: "700" }}>
                      {t.premium.bestValue}
                    </Text>
                  )}
                  <Text style={{ color: palette.text, fontSize: 17, fontWeight: "700" }}>
                    {option === "monthly" ? t.premium.monthly : t.premium.yearly}
                  </Text>
                  <Text style={{ color: palette.textMuted, fontSize: 13 }}>{t.premium.priceFromStore}</Text>
                </Pressable>
              );
            })}
          </View>

          <Body muted center>
            {t.premium.trial}
          </Body>
          <Button label={t.premium.subscribe} disabled onPress={() => {}} />
          <Body muted center>
            {t.premium.comingSoon}
          </Body>
          <Button variant="link" label={t.premium.restore} disabled onPress={() => {}} />
        </>
      )}

      <Body muted>{t.premium.terms}</Body>
    </Screen>
  );
}
