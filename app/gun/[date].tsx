import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  FLOW_INTENSITIES,
  FLOW_LABELS_TR,
  formatDateTR,
  getCycleStartingOn,
  getPeriodCycleForDate,
  isISODate,
  MOOD_LABELS_TR,
  MOODS,
  SYMPTOM_LABELS_TR,
  SYMPTOMS,
  type DailyLog,
  type FlowIntensity,
  type Mood,
  type Symptom,
} from "@/core";
import { Body, Button, Card, Chip, ErrorText, Field, Heading, Loading, Row, Screen } from "@/components/ui";
import { errorMessage } from "@/lib/rules";
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

/** "36,6" de yazılabilsin; Türkçe klavyede ondalık ayıracı virgüldür. */
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
        <ErrorText message="Geçersiz tarih." />
      </Screen>
    );
  }
  if (logQuery.isLoading || cycleData.isLoading) return <Loading />;

  const isFuture = date > today;

  function confirmDeleteCycle(id: string) {
    Alert.alert("Döngüyü sil", "Bu güne girilen adet başlangıcı silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => removeCycle.mutate(id) },
    ]);
  }

  const periodCycle = periodInfo?.periodCycle ?? null;
  const startingCycle = periodInfo?.startingCycle ?? null;
  const actionError = start.error ?? end.error ?? removeCycle.error;

  return (
    <>
      <Stack.Screen options={{ title: formatDateTR(date) }} />
      <Screen edges={[]}>
        <Card>
          <Heading>Adet</Heading>
          {isFuture ? (
            <Body muted>Gelecek bir güne adet başlangıcı girilemez.</Body>
          ) : periodCycle ? (
            periodCycle.periodEndDate === date ? (
              <Body muted>Kanama bu gün bitti olarak işaretli.</Body>
            ) : (
              <Button
                variant="secondary"
                label="Bitişi bu güne al"
                loading={end.isPending}
                onPress={() => end.mutate({ date, cycleId: periodCycle.id })}
              />
            )
          ) : (
            <Button
              variant="secondary"
              label="Adetim bu gün başladı"
              loading={start.isPending}
              onPress={() => start.mutate(date)}
            />
          )}
          {startingCycle && (
            <Button
              variant="link"
              label="Bu güne girilen başlangıcı sil"
              onPress={() => confirmDeleteCycle(startingCycle.id)}
            />
          )}
          <ErrorText message={actionError ? errorMessage(actionError) : null} />
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
      setFormError("Sıcaklık 34–43 °C arasında olmalı.");
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
          <Heading>Kanama yoğunluğu</Heading>
          <Row>
            {FLOW_INTENSITIES.map((value) => (
              <Chip
                key={value}
                label={FLOW_LABELS_TR[value]}
                selected={flow === value}
                color={palette.period}
                onPress={() => setFlow(flow === value ? null : value)}
              />
            ))}
          </Row>

          <Heading>Ruh hâli</Heading>
          <Row>
            {MOODS.map((value) => (
              <Chip
                key={value}
                label={MOOD_LABELS_TR[value]}
                selected={mood === value}
                onPress={() => setMood(mood === value ? null : value)}
              />
            ))}
          </Row>

          <Heading>Belirtiler</Heading>
          <Row>
            {SYMPTOMS.map((value) => (
              <Chip
                key={value}
                label={SYMPTOM_LABELS_TR[value]}
                selected={symptoms.includes(value)}
                onPress={() => toggleSymptom(value)}
              />
            ))}
          </Row>

          <Field
            label="Bazal sıcaklık (°C)"
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="decimal-pad"
            placeholder="36,6"
          />
          <Field
            label="Not"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={2000}
            style={{ minHeight: 90, textAlignVertical: "top", paddingTop: 10 }}
          />
          <ErrorText message={formError ?? (save.error ? errorMessage(save.error) : null)} />
          <Button label="Kaydet" onPress={submit} loading={save.isPending} />
        </Card>
  );
}
