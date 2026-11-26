import { useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  computeCycleStats,
  daysBetween,
  formatDateTR,
  inclusiveDayCount,
  sortCycles,
} from "@/core";
import { Body, Card, ErrorText, Heading, Loading, Screen } from "@/components/ui";
import { errorMessage } from "@/lib/rules";
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

  function confirmDelete(id: string, label: string) {
    Alert.alert("Döngüyü sil", `${label} başlangıçlı döngü silinsin mi? Bu geri alınamaz.`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => remove.mutate(id) },
    ]);
  }

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={[]}>
      <Card>
        <Heading>Döngü</Heading>
        <Stat label="Ortalama döngü" value={`${stats.averageCycleLength} gün${mark}`} />
        <Stat label="Medyan döngü" value={`${stats.medianCycleLength} gün${mark}`} />
        <Stat label="En kısa" value={stats.shortestCycleLength ? `${stats.shortestCycleLength} gün` : "—"} />
        <Stat label="En uzun" value={stats.longestCycleLength ? `${stats.longestCycleLength} gün` : "—"} />
        <Stat label="Ortalama regl süresi" value={`${stats.averagePeriodLength} gün`} />
        <Stat
          label="Düzenlilik"
          value={
            stats.observedCycleCount < 2
              ? "Henüz belli değil"
              : stats.isRegular
                ? `Düzenli (±${stats.cycleLengthVariation} gün)`
                : `Değişken (±${stats.cycleLengthVariation} gün)`
          }
        />
        <Stat label="Hesaba giren döngü" value={String(stats.observedCycleCount)} />
        {stats.usingDefaults && (
          <Body muted>* Tahmini değer: en az iki adet başlangıcı kaydedince gerçek değerler görünür.</Body>
        )}
      </Card>

      <Card>
        <Heading>Döngü geçmişi</Heading>
        <ErrorText message={remove.error ? errorMessage(remove.error) : null} />
        {history.length === 0 && <Body muted>Henüz döngü kaydı yok.</Body>}
        {history.map(({ cycle, length, periodLength }) => (
          <Pressable
            key={cycle.id}
            onLongPress={() => confirmDelete(cycle.id, formatDateTR(cycle.startDate))}
            style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: palette.border }}
          >
            <Text style={{ color: palette.text, fontWeight: "600" }}>{formatDateTR(cycle.startDate)}</Text>
            <Text style={{ color: palette.textMuted }}>
              {length !== null ? `${length} günlük döngü` : "Devam ediyor"} ·{" "}
              {periodLength !== null ? `${periodLength} gün kanama` : "bitiş işaretlenmedi"}
            </Text>
          </Pressable>
        ))}
        {history.length > 0 && <Body muted>Silmek için bir döngüye basılı tut.</Body>}
      </Card>
    </Screen>
  );
}
