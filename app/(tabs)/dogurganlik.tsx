import { useMemo } from "react";
import { Text, View } from "react-native";
import {
  computeCycleStats,
  FERTILITY_LABELS_TR,
  formatRelativeDaysTR,
  formatShortDateTR,
  getDaysUntilFertileWindow,
  getFertileWindowDays,
  predictUpcomingPeriods,
  type FertilityLevel,
} from "@/core";
import { Body, Card, ContraceptionNotice, Heading, Loading, Screen } from "@/components/ui";
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
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={[]}>
      {!view ? (
        <Card>
          <Body>Doğurgan pencereyi tahmin etmek için önce bir adet başlangıcı kaydet.</Body>
        </Card>
      ) : (
        <>
          <Card>
            <Heading>Doğurgan pencere</Heading>
            <Body>
              {formatShortDateTR(view.prediction.fertileWindowStart)} –{" "}
              {formatShortDateTR(view.prediction.fertileWindowEnd)}
            </Body>
            <Body muted>
              {view.until > 0
                ? `Pencere ${formatRelativeDaysTR(view.until)} açılıyor.`
                : view.until === 0
                  ? "Şu an doğurgan penceredesin."
                  : "Bu döngünün penceresi geçti."}
            </Body>
            <Body>
              Tahmini yumurtlama: <Text style={{ fontWeight: "700" }}>{formatShortDateTR(view.prediction.ovulationDate)}</Text>
            </Body>
            {view.usingDefaults && <Body muted>Tahmini değer: henüz yeterli kayıt yok.</Body>}
          </Card>

          <Card>
            <Heading>Günlere göre ihtimal</Heading>
            {view.days.map((day) => {
              const color = day.isOvulation ? palette.ovulation : palette.fertile;
              return (
                <View key={day.date} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: palette.text, fontWeight: day.isOvulation ? "700" : "400" }}>
                      {formatShortDateTR(day.date)}
                      {day.isOvulation ? " · yumurtlama" : ""}
                      {day.date === today ? " · bugün" : ""}
                    </Text>
                    <Text style={{ color: palette.textMuted }}>{FERTILITY_LABELS_TR[day.level]}</Text>
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
