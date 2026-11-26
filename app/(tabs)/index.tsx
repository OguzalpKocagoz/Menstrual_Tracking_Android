import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  buildCycleOverview,
  FLOW_LABELS_TR,
  formatShortDateTR,
  getCurrentCycle,
  getPhaseRanges,
  MOOD_LABELS_TR,
  PHASE_LABELS_TR,
  SYMPTOM_LABELS_TR,
  type CycleOverview,
} from "@/core";
import { CycleRing } from "@/components/cycle-ring";
import { PhaseStrip } from "@/components/phase-strip";
import { Body, Button, Card, ErrorText, Heading, Loading, Screen } from "@/components/ui";
import { errorMessage } from "@/lib/rules";
import {
  useClearPeriodEnd,
  useCycleData,
  useEndPeriod,
  useStartPeriod,
  useToday,
} from "@/lib/data";

/**
 * Halkanın ortasındaki yazı.
 *
 * `endedToday` ayrı bir durum: bitiş günü de kanama günü sayıldığı için
 * (`isBetween` uçları dahil) o gün `isOnPeriod` hâlâ true kalır. Bu ayrım
 * olmadan halka "Adet dönemindesin" demeyi sürdürürdü.
 */
function ringText(overview: CycleOverview, endedToday: boolean): { title: string; subtitle: string | null } {
  const phase = overview.phase ? PHASE_LABELS_TR[overview.phase] : null;

  if (endedToday) return { title: "Adet dönemin bugün bitti", subtitle: phase };
  if (overview.isOnPeriod) return { title: "Adet dönemindesin", subtitle: phase };

  const days = overview.daysUntilNextPeriod;
  if (days === null) return { title: "Henüz kayıt yok", subtitle: "İlk adetini işaretle" };
  if (days > 0) return { title: `Adetine ${days} gün`, subtitle: phase };
  if (days === 0) return { title: "Adetin bugün bekleniyor", subtitle: phase };
  return { title: `Adetin ${Math.abs(days)} gün gecikti`, subtitle: phase };
}

export default function TodayScreen() {
  const router = useRouter();
  const today = useToday();
  const { data, isLoading, isRefetching, refetch, error } = useCycleData();
  const start = useStartPeriod();
  const end = useEndPeriod();
  const undo = useClearPeriodEnd();

  const view = useMemo(() => {
    if (!data) return null;
    const overview = buildCycleOverview(data.cycles, today);
    const current = getCurrentCycle(data.cycles, today);
    return {
      overview,
      current,
      endedToday: current?.periodEndDate === today,
      ranges: getPhaseRanges(overview.stats),
      todayLog: data.logs.find((log) => log.date === today) ?? null,
    };
  }, [data, today]);

  if (isLoading) return <Loading />;
  if (!view) {
    return (
      <Screen onRefresh={refetch} refreshing={isRefetching}>
        <ErrorText message={errorMessage(error, "Veriler yüklenemedi.")} />
        <Button label="Tekrar dene" onPress={() => refetch()} />
      </Screen>
    );
  }

  const { overview, current, endedToday, ranges, todayLog } = view;
  const text = ringText(overview, endedToday);
  const cycleLength = Math.max(15, Math.round(overview.stats.medianCycleLength));
  const mutationError = start.error ?? end.error ?? undo.error;

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={[]}>
      <CycleRing
        cycleDay={overview.cycleDay}
        cycleLength={cycleLength}
        phase={overview.phase}
        title={text.title}
        subtitle={text.subtitle}
      />

      {/* Üç hâl: dönem yok / sürüyor / bugün bitirildi. */}
      {endedToday && current ? (
        <Card style={{ alignItems: "center" }}>
          <Body center>Bitişi bugün olarak işaretledin.</Body>
          <Button
            variant="link"
            label="Geri al"
            loading={undo.isPending}
            onPress={() => undo.mutate(current.id)}
          />
        </Card>
      ) : overview.isOnPeriod ? (
        <Button
          label="Adetim bitti"
          loading={end.isPending}
          onPress={() => end.mutate({ date: today })}
        />
      ) : (
        <Button label="Adetim başladı" loading={start.isPending} onPress={() => start.mutate(today)} />
      )}
      <ErrorText message={mutationError ? errorMessage(mutationError) : null} />

      {overview.nextPeriod && (
        <Card>
          <Heading>Sıradaki adet</Heading>
          <Body>
            {formatShortDateTR(overview.nextPeriod.startDate)} –{" "}
            {formatShortDateTR(overview.nextPeriod.endDate)}
          </Body>
          {overview.stats.usingDefaults && (
            <Body muted>Tahmini değer: yeterli kayıt olunca isabet artar.</Body>
          )}
        </Card>
      )}

      <Card>
        <Heading>Döngü fazları</Heading>
        <PhaseStrip ranges={ranges} active={overview.phase} />
      </Card>

      <Card>
        <Heading>Bugünün kaydı</Heading>
        {todayLog ? (
          <>
            {todayLog.flow && <Body>Kanama: {FLOW_LABELS_TR[todayLog.flow]}</Body>}
            {todayLog.mood && <Body>Ruh hâli: {MOOD_LABELS_TR[todayLog.mood]}</Body>}
            {todayLog.symptoms.length > 0 && (
              <Body>Belirtiler: {todayLog.symptoms.map((s) => SYMPTOM_LABELS_TR[s]).join(", ")}</Body>
            )}
            {todayLog.temperatureC !== null && <Body>Bazal sıcaklık: {todayLog.temperatureC} °C</Body>}
            {todayLog.notes && <Body muted>{todayLog.notes}</Body>}
          </>
        ) : (
          <Body muted>Bugün için kayıt yok.</Body>
        )}
        <Button
          variant="secondary"
          label={todayLog ? "Düzenle" : "Kayıt ekle"}
          onPress={() => router.push(`/gun/${today}`)}
        />
      </Card>
    </Screen>
  );
}
