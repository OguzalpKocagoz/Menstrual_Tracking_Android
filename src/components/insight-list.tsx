import { useRouter } from "expo-router";
import { View } from "react-native";
import type { CycleInsight } from "@/core";
import { Body, Button, Card, Heading } from "@/components/ui";
import { useI18n, type Messages } from "@/i18n";
import { useTheme } from "@/lib/theme";

/**
 * Döngü gözlemleri kartı.
 *
 * Dil bilerek ölçülü: gözlem kullanıcının kendi sayılarını ve kaynağın
 * sınırını yan yana koyar, hastalık adı vermez, "teşhis değildir" der ve
 * doktora yönlendirir. Kayıt hatası ihtimali de açıkça söylenir — unutulmuş
 * tek bir adet kaydı "seyrek döngü" gibi görünebilir.
 */
function describe(t: Messages, insight: CycleInsight): { title: string; body: string; source: string } {
  switch (insight.kind) {
    case "noRecentPeriod":
      return {
        title: t.insights.noRecentPeriod.title,
        body: t.insights.noRecentPeriod.body(insight.days),
        source: t.insights.sourceAcog,
      };
    case "irregular":
      return {
        title: t.insights.irregular.title,
        body: t.insights.irregular.body(insight.shortest, insight.longest, insight.cycleCount),
        source: t.insights.sourceFigo,
      };
    case "frequent":
      return {
        title: t.insights.frequent.title,
        body: t.insights.frequent.body(insight.count, insight.cycleCount),
        source: t.insights.sourceFigo,
      };
    case "infrequent":
      return {
        title: t.insights.infrequent.title,
        body: t.insights.infrequent.body(insight.count, insight.cycleCount),
        source: t.insights.sourceFigo,
      };
    case "prolongedBleeding":
      return {
        title: t.insights.prolongedBleeding.title,
        body: t.insights.prolongedBleeding.body(insight.count, insight.periodCount),
        source: t.insights.sourceFigo,
      };
  }
}

export function InsightList({ insights }: { insights: readonly CycleInsight[] }) {
  const { t } = useI18n();
  const { palette } = useTheme();
  const router = useRouter();
  if (insights.length === 0) return null;

  return (
    <Card style={{ borderColor: palette.ovulation }}>
      <Heading>{t.insights.title}</Heading>
      <Body muted>{t.insights.intro}</Body>
      {insights.map((insight) => {
        const text = describe(t, insight);
        return (
          <View key={insight.kind} style={{ gap: 4 }}>
            <Body>{`• ${text.title}`}</Body>
            <Body muted>{text.body}</Body>
            <Body muted>{text.source}</Body>
          </View>
        );
      })}
      <Body>{t.insights.advice}</Body>
      <Button variant="link" label={t.insights.howDecided} onPress={() => router.push("/tahmin")} />
    </Card>
  );
}
