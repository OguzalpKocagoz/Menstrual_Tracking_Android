import { useRouter } from "expo-router";
import { useMemo } from "react";
import { buildCycleOverview, getCurrentCycle, getPhaseRanges, type CycleOverview } from "@/core";
import { CycleRing } from "@/components/cycle-ring";
import { PhaseStrip } from "@/components/phase-strip";
import { Body, Button, Card, ErrorText, Heading, Loading, Screen } from "@/components/ui";
import { useI18n, type Messages } from "@/i18n";
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
function ringText(
  t: Messages,
  overview: CycleOverview,
  endedToday: boolean,
): { title: string; subtitle: string | null } {
  const phase = overview.phase ? t.labels.phase[overview.phase] : null;

  if (endedToday) return { title: t.today.endedToday, subtitle: phase };
  if (overview.isOnPeriod) return { title: t.today.onPeriod, subtitle: phase };

  const days = overview.daysUntilNextPeriod;
  if (days === null) return { title: t.today.noData, subtitle: t.today.noDataHint };
  if (days > 0) return { title: t.today.daysUntil(days), subtitle: phase };
  if (days === 0) return { title: t.today.dueToday, subtitle: phase };
  return { title: t.today.late(Math.abs(days)), subtitle: phase };
}

/** Ondalık ayıracı dile göre: "36,6" / "36.6". */
function formatTemperature(value: number, t: Messages): string {
  const separator = t.day.temperaturePlaceholder.includes(",") ? "," : ".";
  return String(value).replace(".", separator);
}

export default function TodayScreen() {
  const router = useRouter();
  const { t, format, errorText } = useI18n();
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
        <ErrorText message={errorText(error, t.errors.loadFailed)} />
        <Button label={t.common.retry} onPress={() => refetch()} />
      </Screen>
    );
  }

  const { overview, current, endedToday, ranges, todayLog } = view;
  const text = ringText(t, overview, endedToday);
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
          <Body center>{t.today.endMarkedToday}</Body>
          <Button
            variant="link"
            label={t.today.undo}
            loading={undo.isPending}
            onPress={() => undo.mutate(current.id)}
          />
        </Card>
      ) : overview.isOnPeriod ? (
        <Button
          label={t.today.periodEnded}
          loading={end.isPending}
          onPress={() => end.mutate({ date: today })}
        />
      ) : (
        <Button label={t.today.periodStarted} loading={start.isPending} onPress={() => start.mutate(today)} />
      )}
      <ErrorText message={mutationError ? errorText(mutationError) : null} />

      {overview.nextPeriod && (
        <Card>
          <Heading>{t.today.nextPeriod}</Heading>
          <Body>
            {format.shortDate(overview.nextPeriod.startDate)} – {format.shortDate(overview.nextPeriod.endDate)}
          </Body>
          {overview.stats.usingDefaults && <Body muted>{t.today.estimateNote}</Body>}
        </Card>
      )}

      <Card>
        <Heading>{t.today.phases}</Heading>
        <PhaseStrip ranges={ranges} active={overview.phase} />
      </Card>

      <Card>
        <Heading>{t.today.todayLog}</Heading>
        {todayLog ? (
          <>
            {todayLog.flow && <Body>{t.today.flowLine(t.labels.flow[todayLog.flow])}</Body>}
            {todayLog.mood && <Body>{t.today.moodLine(t.labels.mood[todayLog.mood])}</Body>}
            {todayLog.symptoms.length > 0 && (
              <Body>{t.today.symptomsLine(todayLog.symptoms.map((s) => t.labels.symptom[s]).join(", "))}</Body>
            )}
            {todayLog.temperatureC !== null && (
              <Body>{t.today.temperatureLine(formatTemperature(todayLog.temperatureC, t))}</Body>
            )}
            {todayLog.notes && <Body muted>{todayLog.notes}</Body>}
          </>
        ) : (
          <Body muted>{t.today.noLog}</Body>
        )}
        <Button
          variant="secondary"
          label={todayLog ? t.common.edit : t.today.addLog}
          onPress={() => router.push(`/gun/${today}`)}
        />
      </Card>
    </Screen>
  );
}
