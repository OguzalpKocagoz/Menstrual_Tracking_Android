import {
  addDays,
  computeCycleStats,
  daysBetween,
  FLOW_INTENSITIES,
  MAX_PLAUSIBLE_PERIOD_LENGTH,
  MOODS,
  predictUpcomingPeriods,
  RECENT_CYCLE_SAMPLE_SIZE,
  SYMPTOMS,
  UserError,
  type Cycle,
  type DailyLog,
  type FlowIntensity,
  type ISODate,
  type Mood,
  type Symptom,
} from "@/core";

/**
 * Veri kuralları.
 *
 * Web sürümünde bunlar sunucuda (Mongoose şeması ve API uçları) uygulanıyordu.
 * Mobil sürüm veriyi yalnızca telefonda tuttuğu için aynı kurallar burada,
 * veritabanına yazmadan önce çalışır. Saf fonksiyonlardır; SQLite'a ya da
 * React Native'e bağlı değiller, bu yüzden Node'da test edilebilirler.
 */

export type DailyLogInput = Omit<DailyLog, "date">;

/**
 * Kaydın "o gün girilmiş" sayılacağı pencere.
 *
 * Kullanıcı geçmişi toplu girdiğinde o tarihler için ekranda hiçbir tahmin
 * gösterilmemişti; sonradan hesaplanmış bir tahmini isabet ölçümüne katmak
 * uydurma bir başarı oranı üretirdi.
 */
export const RECENT_ENTRY_DAYS = 7;

/**
 * "Adetim başladı" anında ekranda gösterilen tahmin.
 *
 * Sonradan hesaplanamayacak tek bilgi budur; isabet istatistiği buna dayanır.
 * Yalnızca bu tarihten **önce** başlamış döngülere bakılır — sonrakiler o an
 * bilinmiyordu.
 */
export function capturePrediction(
  cycles: readonly Cycle[],
  startDate: ISODate,
  today: ISODate,
): ISODate | null {
  if (Math.abs(daysBetween(startDate, today)) > RECENT_ENTRY_DAYS) return null;

  const prior = cycles
    .filter((cycle) => cycle.startDate < startDate)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
    .slice(-(RECENT_CYCLE_SAMPLE_SIZE + 1));
  if (prior.length === 0) return null;

  const stats = computeCycleStats(prior);
  // Referans gün son döngünün başlangıcı: aradaki tahminler atlanmasın, ilk
  // sıradaki tahmin bu döngüye ait olsun.
  const lastStart = prior[prior.length - 1]!.startDate;
  const [prediction] = predictUpcomingPeriods(prior, stats, 1, lastStart);
  return prediction?.startDate ?? null;
}

export function assertStartDate(date: ISODate, today: ISODate): void {
  if (date > today) throw new UserError("futureStart");
}

export function assertPeriodRange(startDate: ISODate, periodEndDate: ISODate | null): void {
  if (!periodEndDate) return;
  if (periodEndDate < startDate) {
    throw new UserError("endBeforeStart");
  }
  if (periodEndDate > addDays(startDate, MAX_PLAUSIBLE_PERIOD_LENGTH - 1)) {
    throw new UserError("periodTooLong", { max: MAX_PLAUSIBLE_PERIOD_LENGTH });
  }
}

const MAX_NOTE_LENGTH = 2000;

/** Formdan gelen günlük kaydını süzer; geçersiz değerde `UserError` fırlatır. */
export function sanitizeLog(input: DailyLogInput): DailyLogInput {
  if (input.flow !== null && !FLOW_INTENSITIES.includes(input.flow as FlowIntensity)) {
    throw new UserError("invalidFlow");
  }
  if (input.mood !== null && !MOODS.includes(input.mood as Mood)) {
    throw new UserError("invalidMood");
  }
  const temperature = input.temperatureC;
  if (temperature !== null && (!Number.isFinite(temperature) || temperature < 34 || temperature > 43)) {
    throw new UserError("temperatureRange");
  }

  const notes = input.notes?.trim().slice(0, MAX_NOTE_LENGTH) || null;
  const symptoms = [...new Set(input.symptoms)].filter((value): value is Symptom =>
    SYMPTOMS.includes(value),
  );

  return { flow: input.flow, mood: input.mood, symptoms, notes, temperatureC: temperature };
}

/** Tamamen boş bir günlük kaydı saklanmaz, silinir. */
export function isEmptyLog(log: DailyLogInput): boolean {
  return (
    log.flow === null &&
    log.mood === null &&
    log.symptoms.length === 0 &&
    log.temperatureC === null &&
    (log.notes === null || log.notes.trim() === "")
  );
}

/** Varsayılan uzunluk alanı: boş → null, aralık dışı → `UserError`. */
export function parseLength(
  value: string,
  min: number,
  max: number,
  field: "cycleLength" | "periodLength",
): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new UserError("lengthRange", { field, min, max });
  }
  return number;
}
