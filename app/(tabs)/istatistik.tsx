import { useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  computeCycleStats,
  daysBetween,
  inclusiveDayCount,
  sortCycles,
} from "@/core";
import { Body, Card, ErrorText, Heading, Loading, Screen } from "@/components/ui";
import { useI18n } from "@/i18n";
import { AdBanner } from "@/lib/ads";
import { useCycleData, useDeleteCycle } from "@/lib/data";
import { useTheme } from "@/lib/theme";

function Stat({ label, value }: { label: string; value: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: palette.textMuted, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { palette } = useTheme();
  const { t, format, errorText } = useI18n();
  const { data, isLoading, isRefetching, refetch } = useCycleData();
  const remove = useDeleteCycle();

  const view = useMemo(() => {
    if (!data) return null;
    const sorted = sortCycles(data.cycles);
    // Geçmiş listesi yeniden eskiye; her döngünün uzunluğu bir sonrakinin başlangıcına göre.
    const history = sorted
      .map((cycle, index) => ({
        cycle,
        length: sorted[index + 1] ? daysBetween(cycle.startDate, sorted[index + 1]!.startDate) : null,
        periodLength: cycle.periodEndDate ? inclusiveDayCount(cycle.startDate, cycle.periodEndDate) : null,
      }))
      .reverse();
    return { stats: computeCycleStats(data.cycles), history };
  }, [data]);

  if (isLoading || !view) return <Loading />;
  const { stats, history } = view;
  const mark = stats.usingDefaults ? " *" : "";
  const days = (n: number) => t.common.days(n);

  function confirmDelete(id: string, label: string) {
    Alert.alert(t.stats.deleteTitle, t.stats.deleteBody(label), [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: () => remove.mutate(id) },
    ]);
  }

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={[]} footer={<AdBanner />}>
      <Card>
        <Heading>{t.stats.cycle}</Heading>
        <Stat label={t.stats.average} value={`${days(stats.averageCycleLength)}${mark}`} />
        <Stat label={t.stats.median} value={`${days(stats.medianCycleLength)}${mark}`} />
        <Stat label={t.stats.shortest} value={stats.shortestCycleLength ? days(stats.shortestCycleLength) : "—"} />
        <Stat label={t.stats.longest} value={stats.longestCycleLength ? days(stats.longestCycleLength) : "—"} />
        <Stat label={t.stats.averagePeriod} value={days(stats.averagePeriodLength)} />
        <Stat
          label={t.stats.regularity}
          value={
            stats.observedCycleCount < 2
              ? t.stats.notYet
              : stats.isRegular
                ? t.stats.regular(stats.cycleLengthVariation)
                : t.stats.variable(stats.cycleLengthVariation)
          }
        />
        <Stat label={t.stats.counted} value={String(stats.observedCycleCount)} />
        {stats.usingDefaults && <Body muted>{t.stats.estimateNote}</Body>}
      </Card>

      <Card>
        <Heading>{t.stats.history}</Heading>
        <ErrorText message={remove.error ? errorText(remove.error) : null} />
        {history.length === 0 && <Body muted>{t.stats.noHistory}</Body>}
        {history.map(({ cycle, length, periodLength }) => (
          <Pressable
            key={cycle.id}
            onLongPress={() => confirmDelete(cycle.id, format.date(cycle.startDate))}
            style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: palette.border }}
          >
            <Text style={{ color: palette.text, fontWeight: "600" }}>{format.date(cycle.startDate)}</Text>
            <Text style={{ color: palette.textMuted }}>
              {length !== null ? t.stats.cycleLength(length) : t.stats.ongoing} ·{" "}
              {periodLength !== null ? t.stats.bleeding(periodLength) : t.stats.noEnd}
            </Text>
          </Pressable>
        ))}
        {history.length > 0 && <Body muted>{t.stats.longPressHint}</Body>}
      </Card>
    </Screen>
  );
}
