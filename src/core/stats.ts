import {
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
  MAX_PLAUSIBLE_CYCLE_LENGTH,
  MAX_PLAUSIBLE_PERIOD_LENGTH,
  MIN_PLAUSIBLE_CYCLE_LENGTH,
  RECENT_CYCLE_SAMPLE_SIZE,
  REGULARITY_THRESHOLD_DAYS,
} from "./constants";
import { compareDates, daysBetween, inclusiveDayCount } from "./date";
import type { Cycle, CycleStats } from "./types";

/** Girdiyi değiştirmeden, başlangıç tarihine göre eskiden yeniye sıralar. */
export function sortCycles(cycles: readonly Cycle[]): Cycle[] {
  return [...cycles].sort((a, b) => compareDates(a.startDate, b.startDate));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function standardDeviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

/**
 * Ardışık iki döngü başlangıcı arasındaki gün farkları.
 * Son döngünün uzunluğu henüz bilinmediği için sonuç, döngü sayısından bir eksiktir.
 */
export function getCycleLengths(cycles: readonly Cycle[]): number[] {
  const sorted = sortCycles(cycles);
  const lengths: number[] = [];

  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) continue;

    const length = daysBetween(previous.startDate, current.startDate);
    if (length >= MIN_PLAUSIBLE_CYCLE_LENGTH && length <= MAX_PLAUSIBLE_CYCLE_LENGTH) {
      lengths.push(length);
    }
  }
  return lengths;
}

/** Yalnızca bitişi işaretlenmiş döngüler için regl süresi. */
export function getPeriodLengths(cycles: readonly Cycle[]): number[] {
  const lengths: number[] = [];

  for (const cycle of cycles) {
    if (!cycle.periodEndDate) continue;
    const length = inclusiveDayCount(cycle.startDate, cycle.periodEndDate);
    if (length >= 1 && length <= MAX_PLAUSIBLE_PERIOD_LENGTH) {
      lengths.push(length);
    }
  }
  return lengths;
}

function takeRecent(values: readonly number[]): number[] {
  return values.slice(-RECENT_CYCLE_SAMPLE_SIZE);
}

/**
 * Kullanıcının döngü istatistikleri. Veri yetersizse varsayılan değerlere
 * düşer ve bunu `usingDefaults` ile bildirir — arayüz bu durumda tahmini
 * "tahmini değer" olarak işaretleyebilsin diye.
 */
export function computeCycleStats(cycles: readonly Cycle[]): CycleStats {
  const cycleLengths = takeRecent(getCycleLengths(cycles));
  const periodLengths = takeRecent(getPeriodLengths(cycles));

  const hasCycleData = cycleLengths.length > 0;
  const variation = standardDeviation(cycleLengths);

  const averageCycleLength = hasCycleData
    ? Math.round(mean(cycleLengths) * 10) / 10
    : DEFAULT_CYCLE_LENGTH;

  const averagePeriodLength =
    periodLengths.length > 0
      ? Math.round(mean(periodLengths) * 10) / 10
      : DEFAULT_PERIOD_LENGTH;

  return {
    averageCycleLength,
    medianCycleLength: hasCycleData ? median(cycleLengths) : DEFAULT_CYCLE_LENGTH,
    shortestCycleLength: hasCycleData ? Math.min(...cycleLengths) : null,
    longestCycleLength: hasCycleData ? Math.max(...cycleLengths) : null,
    cycleLengthVariation: Math.round(variation * 10) / 10,
    averagePeriodLength,
    observedCycleCount: cycleLengths.length,
    // Tek döngüden düzenlilik çıkarımı yapılamaz; varsayılan olarak düzenli sayılır.
    isRegular: cycleLengths.length < 2 || variation <= REGULARITY_THRESHOLD_DAYS,
    usingDefaults: !hasCycleData,
  };
}
