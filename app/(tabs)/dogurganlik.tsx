import { useMemo } from "react";
import { Text, View } from "react-native";
import {
  computeCycleStats,
  getDaysUntilFertileWindow,
  getFertileWindowDays,
  predictUpcomingPeriods,
  type FertilityLevel,
} from "@/core";
import { Body, Card, ContraceptionNotice, Heading, Loading, Screen } from "@/components/ui";
import { useI18n } from "@/i18n";
import { AdBanner } from "@/lib/ads";
import { useCycleData, useToday } from "@/lib/data";
import { useTheme } from "@/lib/theme";

/** Çubuk uzunluğu yalnızca görsel; seviyeler `getFertilityLevel`'dan gelir. */
const LEVEL_WIDTH: Record<FertilityLevel, number> = {
  peak: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
  none: 0.08,
};

export default function FertilityScreen() {
  const today = useToday();
  const { palette } = useTheme();
  const { t, format } = useI18n();
  const { data, isLoading, isRefetching, refetch } = useCycleData();

  const view = useMemo(() => {
    if (!data) return null;
    const stats = computeCycleStats(data.cycles);
    const [next] = predictUpcomingPeriods(data.cycles, stats, 1, today);
    if (!next) return null;
    return {
      prediction: next,
      days: getFertileWindowDays(next),
      until: getDaysUntilFertileWindow(today, next),
      usingDefaults: stats.usingDefaults,
    };
  }, [data, today]);

  if (isLoading) return <Loading />;

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={[]} footer={<AdBanner />}>
      {!view ? (
        <Card>
          <Body>{t.fertility.needPeriod}</Body>
        </Card>
      ) : (
        <>
          <Card>
            <Heading>{t.fertility.window}</Heading>
            <Body>
              {format.shortDate(view.prediction.fertileWindowStart)} –{" "}
              {format.shortDate(view.prediction.fertileWindowEnd)}
            </Body>
            <Body muted>
              {view.until > 0
                ? t.fertility.opensIn(view.until)
                : view.until === 0
                  ? t.fertility.inWindow
                  : t.fertility.passed}
            </Body>
            <Body>
              {t.fertility.ovulation}
              <Text style={{ fontWeight: "700" }}>{format.shortDate(view.prediction.ovulationDate)}</Text>
            </Body>
            {view.usingDefaults && <Body muted>{t.fertility.estimateNote}</Body>}
          </Card>

          <Card>
            <Heading>{t.fertility.byDay}</Heading>
            {view.days.map((day) => {
              const color = day.isOvulation ? palette.ovulation : palette.fertile;
              return (
                <View key={day.date} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: palette.text, fontWeight: day.isOvulation ? "700" : "400" }}>
                      {format.shortDate(day.date)}
                      {day.isOvulation ? t.fertility.ovulationTag : ""}
                      {day.date === today ? t.fertility.todayTag : ""}
                    </Text>
                    <Text style={{ color: palette.textMuted }}>{t.labels.fertility[day.level]}</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.surfaceMuted }}>
                    <View
                      style={{
                        width: `${LEVEL_WIDTH[day.level] * 100}%`,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: color,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}
      <ContraceptionNotice />
    </Screen>
  );
}
