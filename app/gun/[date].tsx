import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  FLOW_INTENSITIES,
  getCycleStartingOn,
  getPeriodCycleForDate,
  isISODate,
  MOODS,
  SYMPTOMS,
  type DailyLog,
  type FlowIntensity,
  type Mood,
  type Symptom,
} from "@/core";
import { Body, Button, Card, Chip, ErrorText, Field, Heading, Loading, Row, Screen } from "@/components/ui";
import { useI18n } from "@/i18n";
import {
  useCycleData,
  useDailyLog,
  useDeleteCycle,
  useEndPeriod,
  useSaveDailyLog,
  useStartPeriod,
  useToday,
} from "@/lib/data";
import { useTheme } from "@/lib/theme";

/** "36,6" de "36.6" da yazılabilsin; ondalık ayıracı klavyenin diline göre değişir. */
function parseTemperature(value: string): number | null | "invalid" {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < 34 || number > 43) return "invalid";
  return Math.round(number * 100) / 100;
}

export default function DayScreen() {
  const params = useLocalSearchParams<{ date: string }>();
  const date = typeof params.date === "string" && isISODate(params.date) ? params.date : null;
  const router = useRouter();
  const { t, format, errorText } = useI18n();
  const today = useToday();

  const cycleData = useCycleData();
  const logQuery = useDailyLog(date ?? today);
  const start = useStartPeriod();
  const end = useEndPeriod();
  const removeCycle = useDeleteCycle();

  const periodInfo = useMemo(() => {
    if (!cycleData.data || !date) return null;
    return {
      periodCycle: getPeriodCycleForDate(date, cycleData.data.cycles, today),
      startingCycle: getCycleStartingOn(date, cycleData.data.cycles),
    };
  }, [cycleData.data, date, today]);

  if (!date) {
    return (
      <Screen edges={[]}>
        <ErrorText message={t.errors.invalidDate} />
      </Screen>
    );
  }
  if (logQuery.isLoading || cycleData.isLoading) return <Loading />;

  const isFuture = date > today;

  function confirmDeleteCycle(id: string) {
    Alert.alert(t.day.deleteTitle, t.day.deleteBody, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: () => removeCycle.mutate(id) },
    ]);
  }

  const periodCycle = periodInfo?.periodCycle ?? null;
  const startingCycle = periodInfo?.startingCycle ?? null;
  const actionError = start.error ?? end.error ?? removeCycle.error;

  return (
    <>
      <Stack.Screen options={{ title: format.date(date) }} />
      <Screen edges={[]}>
        <Card>
          <Heading>{t.day.period}</Heading>
          {isFuture ? (
            <Body muted>{t.day.futureNote}</Body>
          ) : periodCycle ? (
            periodCycle.periodEndDate === date ? (
              <Body muted>{t.day.endedThisDay}</Body>
            ) : (
              <Button
                variant="secondary"
                label={t.day.endHere}
                loading={end.isPending}
                onPress={() => end.mutate({ date, cycleId: periodCycle.id })}
              />
            )
          ) : (
            <Button
              variant="secondary"
              label={t.day.startHere}
              loading={start.isPending}
              onPress={() => start.mutate(date)}
            />
          )}
          {startingCycle && (
            <Button
              variant="link"
              label={t.day.deleteStart}
              onPress={() => confirmDeleteCycle(startingCycle.id)}
            />
          )}
          <ErrorText message={actionError ? errorText(actionError) : null} />
        </Card>

        <LogForm key={date} date={date} initial={logQuery.data ?? null} onSaved={() => router.back()} />
      </Screen>
    </>
  );
}

/**
 * Günlük formu. Kayıt yüklendikten sonra çizilir ve ilk değerlerini doğrudan
 * alır; böylece sorgu sonucu bir effect içinde forma kopyalanmaz.
 */
function LogForm({
  date,
  initial,
  onSaved,
}: {
  date: string;
  initial: DailyLog | null;
  onSaved: () => void;
}) {
  const { palette } = useTheme();
  const { t, errorText } = useI18n();
  const save = useSaveDailyLog(date);
  const [flow, setFlow] = useState<FlowIntensity | null>(initial?.flow ?? null);
  const [mood, setMood] = useState<Mood | null>(initial?.mood ?? null);
  const [symptoms, setSymptoms] = useState<Symptom[]>(initial?.symptoms ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [temperature, setTemperature] = useState(
    initial?.temperatureC != null ? String(initial.temperatureC).replace(".", ",") : "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  function submit() {
    setFormError(null);
    const temperatureC = parseTemperature(temperature);
    if (temperatureC === "invalid") {
      setFormError(t.errors.temperatureRange);
      return;
    }
    // Tamamen boş kaydedilen gün silinir.
    save.mutate({ flow, mood, symptoms, notes: notes.trim() || null, temperatureC }, { onSuccess: onSaved });
  }

  function toggleSymptom(symptom: Symptom) {
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom],
    );
  }

  return (
        <Card>
          <Heading>{t.day.flow}</Heading>
          <Row>
            {FLOW_INTENSITIES.map((value) => (
              <Chip
                key={value}
                label={t.labels.flow[value]}
                selected={flow === value}
                color={palette.period}
                onPress={() => setFlow(flow === value ? null : value)}
              />
            ))}
          </Row>

          <Heading>{t.day.mood}</Heading>
          <Row>
            {MOODS.map((value) => (
              <Chip
                key={value}
                label={t.labels.mood[value]}
                selected={mood === value}
                onPress={() => setMood(mood === value ? null : value)}
              />
            ))}
          </Row>

          <Heading>{t.day.symptoms}</Heading>
          <Row>
            {SYMPTOMS.map((value) => (
              <Chip
                key={value}
                label={t.labels.symptom[value]}
                selected={symptoms.includes(value)}
                onPress={() => toggleSymptom(value)}
              />
            ))}
          </Row>

          <Field
            label={t.day.temperature}
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="decimal-pad"
            placeholder={t.day.temperaturePlaceholder}
          />
          <Field
            label={t.day.note}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={2000}
            style={{ minHeight: 90, textAlignVertical: "top", paddingTop: 10 }}
          />
          <ErrorText message={formError ?? (save.error ? errorText(save.error) : null)} />
          <Button label={t.common.save} onPress={submit} loading={save.isPending} />
        </Card>
  );
}
