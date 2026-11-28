import {
  IRREGULAR_RANGE_DAYS,
  MIN_CYCLES_FOR_INSIGHTS,
  NO_PERIOD_ALERT_DAYS,
  NORMAL_CYCLE_MAX_DAYS,
  NORMAL_CYCLE_MIN_DAYS,
  NORMAL_PERIOD_MAX_DAYS,
  OUT_OF_RANGE_MIN_COUNT,
  RECENT_CYCLE_SAMPLE_SIZE,
} from "./constants";
import { addDays, daysBetween, type ISODate } from "./date";
import { getCycleLengths, getPeriodLengths, sortCycles } from "./stats";
import type { Cycle, CycleStats, PeriodPrediction } from "./types";

/**
 * Tahmin aralığı ve döngü gözlemleri.
 *
 * Bu modül teşhis koymaz. Yalnızca kullanıcının kendi kayıtlarını yayımlanmış
 * klinik sınırlarla (bkz. `constants.ts`) karşılaştırır; arayüz her gözlemi
 * "teşhis değildir, kayıtların doğruysa bir doktorla konuş" diye sunar ve
 * hastalık adı kullanmaz. Bu çizgi hem mağaza kuralları hem de tıbbi cihaz
 * mevzuatı açısından önemli: bilgi vermek serbest, teşhis koymak değil.
 */

// ── Tahmin aralığı ──────────────────────────────────────────────────────────

export interface PredictionWindow {
  /** En erken olası başlangıç. */
  earliest: ISODate;
  /** En olası başlangıç (tahminin kendisi). */
  likely: ISODate;
  /** En geç olası başlangıç. */
  latest: ISODate;
  /** Tahminin iki yanındaki gün sayısı. */
  spreadDays: number;
  /** Döngüler tahmini anlamsızlaştıracak kadar değişken mi. */
  highlyVariable: boolean;
}

/** Aralık hiçbir durumda bundan geniş gösterilmez; ötesi bilgi taşımaz. */
const MAX_SPREAD_DAYS = 10;

/**
 * Tahminin belirsizliği. Tek tarih yerine aralık göstermek bilimsel olarak
 * daha dürüst: döngüler doğal olarak birkaç gün oynar.
 *
 * Genişlik, son döngülerin standart sapmasından gelir (≈ döngülerin üçte
 * ikisinin düştüğü aralık). Veri azken sabit, geniş bir aralık kullanılır;
 * sıfır sapmalı birkaç döngü de "kesin" gösterilmez, en az 1 gün pay kalır.
 */
export function getPredictionWindow(prediction: PeriodPrediction, stats: CycleStats): PredictionWindow {
  let spreadDays: number;
  if (stats.usingDefaults) spreadDays = 4;
  else if (stats.observedCycleCount < 2) spreadDays = 3;
  else spreadDays = Math.min(MAX_SPREAD_DAYS, Math.max(1, Math.ceil(stats.cycleLengthVariation)));

  const range =
    stats.shortestCycleLength !== null && stats.longestCycleLength !== null
      ? stats.longestCycleLength - stats.shortestCycleLength
      : 0;

  return {
    earliest: addDays(prediction.startDate, -spreadDays),
    likely: prediction.startDate,
    latest: addDays(prediction.startDate, spreadDays),
    spreadDays,
    highlyVariable: stats.observedCycleCount >= 2 && range >= IRREGULAR_RANGE_DAYS,
  };
}

// ── Gözlemler ───────────────────────────────────────────────────────────────

export type CycleInsight =
  | { kind: "noRecentPeriod"; days: number }
  | { kind: "irregular"; shortest: number; longest: number; cycleCount: number }
  | { kind: "frequent"; count: number; cycleCount: number }
  | { kind: "infrequent"; count: number; cycleCount: number }
  | { kind: "prolongedBleeding"; count: number; periodCount: number };

export type CycleInsightKind = CycleInsight["kind"];

/**
 * Kullanıcının son döngülerini klinik sınırlarla karşılaştırır.
 *
 * Yeterli kayıt yoksa (3'ten az ölçülmüş döngü) "uzun süredir adet yok"
 * dışında hiçbir gözlem üretilmez: iki döngüden kalıp çıkarmak yanlış alarm
 * üretir. Sıra önem sırasıdır.
 */
export function getCycleInsights(cycles: readonly Cycle[], today: ISODate): CycleInsight[] {
  const insights: CycleInsight[] = [];
  const sorted = sortCycles(cycles);
  const last = sorted[sorted.length - 1];

  if (last && last.startDate <= today) {
    const days = daysBetween(last.startDate, today);
    if (days >= NO_PERIOD_ALERT_DAYS) insights.push({ kind: "noRecentPeriod", days });
  }

  const lengths = getCycleLengths(cycles).slice(-RECENT_CYCLE_SAMPLE_SIZE);
  if (lengths.length >= MIN_CYCLES_FOR_INSIGHTS) {
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    if (longest - shortest >= IRREGULAR_RANGE_DAYS) {
      insights.push({ kind: "irregular", shortest, longest, cycleCount: lengths.length });
    }

    const frequent = lengths.filter((length) => length < NORMAL_CYCLE_MIN_DAYS).length;
    if (frequent >= OUT_OF_RANGE_MIN_COUNT) {
      insights.push({ kind: "frequent", count: frequent, cycleCount: lengths.length });
    }

    const infrequent = lengths.filter((length) => length > NORMAL_CYCLE_MAX_DAYS).length;
    if (infrequent >= OUT_OF_RANGE_MIN_COUNT) {
      insights.push({ kind: "infrequent", count: infrequent, cycleCount: lengths.length });
    }
  }

  const periods = getPeriodLengths(sortCycles(cycles)).slice(-RECENT_CYCLE_SAMPLE_SIZE);
  const prolonged = periods.filter((length) => length > NORMAL_PERIOD_MAX_DAYS).length;
  if (prolonged >= OUT_OF_RANGE_MIN_COUNT) {
    insights.push({ kind: "prolongedBleeding", count: prolonged, periodCount: periods.length });
  }

  return insights;
}
