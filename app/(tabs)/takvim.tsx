import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  addMonths,
  buildDayMarkers,
  buildMonthGrid,
  computeCycleStats,
  formatMonthTR,
  getDayOfMonth,
  getMonth,
  getYear,
  WEEKDAY_LABELS_TR,
  type DayMarker,
} from "@/core";
import { Body, Button, Card, Loading, Row, Screen } from "@/components/ui";
import { useCycleData, useToday } from "@/lib/data";
import { useTheme, type Palette } from "@/lib/theme";

/**
 * Aylık takvim, pazartesi başlangıçlı.
 *
 * Veri bir kez ve geniş aralıkla çekilir (geriye ~550, ileriye ~200 gün);
 * aylar arasında gezinmek yeni istek atmaz. Boyama kuralları tamamen
 * `buildDayMarkers`'ta: gerçek kayıt varken tahmin boyanmaz, doğurgan pencere
 * regl günlerinde de gösterilir.
 */
function dayStyle(marker: DayMarker | undefined, palette: Palette) {
  if (!marker) return { background: "transparent", color: palette.text, border: "transparent" };
  if (marker.inPeriod) return { background: palette.period, color: palette.onBrand, border: palette.period };
  if (marker.predictedPeriod) return { background: palette.periodSoft, color: palette.text, border: palette.predicted };
  if (marker.isOvulation) return { background: palette.ovulation, color: palette.onBrand, border: palette.ovulation };
  if (marker.fertile) return { background: palette.fertileSoft, color: palette.text, border: palette.fertileSoft };
  return { background: "transparent", color: palette.text, border: "transparent" };
}

export default function CalendarScreen() {
  const router = useRouter();
  const today = useToday();
  const { palette } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useCycleData();
  const [month, setMonth] = useState(() => ({ year: getYear(today), month: getMonth(today) }));

  const stats = useMemo(() => (data ? computeCycleStats(data.cycles) : null), [data]);
  const weeks = useMemo(() => buildMonthGrid(month.year, month.month), [month]);

  const markers = useMemo(() => {
    if (!data || !stats) return new Map<string, DayMarker>();
    return buildDayMarkers(weeks.flat(), {
      cycles: data.cycles,
      loggedDates: data.logs.map((log) => log.date),
      stats,
      today,
    });
  }, [data, stats, weeks, today]);

  if (isLoading) return <Loading />;

  const move = (delta: number) => setMonth((current) => addMonths(current.year, current.month, delta));

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={[]}>
      <Row style={{ justifyContent: "space-between" }}>
        <Button variant="secondary" label="‹" onPress={() => move(-1)} />
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700" }}>
          {formatMonthTR(month.year, month.month)}
        </Text>
        <Button variant="secondary" label="›" onPress={() => move(1)} />
      </Row>

      <Card style={{ padding: 10, gap: 6 }}>
        <View style={styles.week}>
          {WEEKDAY_LABELS_TR.map((label) => (
            <Text key={label} style={[styles.weekday, { color: palette.textMuted }]}>
              {label}
            </Text>
          ))}
        </View>
        {weeks.map((week) => (
          <View key={week[0]} style={styles.week}>
            {week.map((date) => {
              const marker = markers.get(date);
              const look = dayStyle(marker, palette);
              const outside = getMonth(date) !== month.month;
              return (
                <Pressable
                  key={date}
                  onPress={() => router.push(`/gun/${date}`)}
                  style={styles.cell}
                  accessibilityLabel={date}
                >
                  <View
                    style={[
                      styles.day,
                      {
                        backgroundColor: look.background,
                        borderColor: marker?.isToday ? palette.text : look.border,
                        borderWidth: marker?.isToday ? 2 : 1,
                        borderStyle: marker?.predictedPeriod ? "dashed" : "solid",
                        opacity: outside ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: look.color, fontWeight: marker?.isToday ? "700" : "400" }}>
                      {getDayOfMonth(date)}
                    </Text>
                  </View>
                  {marker?.hasLog && <View style={[styles.logDot, { backgroundColor: palette.brand }]} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <Legend color={palette.period} label="Adet (kayıt)" />
        <Legend color={palette.periodSoft} border={palette.predicted} label="Tahmini adet" dashed />
        <Legend color={palette.fertileSoft} label="Doğurgan pencere" />
        <Legend color={palette.ovulation} label="Tahmini yumurtlama" />
        <Body muted>Bir güne dokunarak kayıt ekleyebilirsin.</Body>
      </Card>
    </Screen>
  );
}

function Legend({ color, label, border, dashed }: { color: string; label: string; border?: string; dashed?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: color,
          borderWidth: border ? 1 : 0,
          borderColor: border,
          borderStyle: dashed ? "dashed" : "solid",
        }}
      />
      <Text style={{ color: palette.text }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600" },
  cell: { flex: 1, alignItems: "center", paddingVertical: 3 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  logDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
