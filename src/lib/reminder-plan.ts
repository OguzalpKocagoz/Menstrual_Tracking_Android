import { addDays, computeCycleStats, predictUpcomingPeriods, type Cycle, type ISODate } from "@/core";

/**
 * Hangi gün hangi hatırlatmanın gideceğini hesaplar.
 *
 * Saf fonksiyondur (bildirim kütüphanesine bağlı değil), bu yüzden test
 * edilir. Zamanlama `reminders.ts`'te yapılır.
 */

export type ReminderKind = "period" | "fertile";

export interface PlannedReminder {
  kind: ReminderKind;
  date: ISODate;
}

export interface ReminderOptions {
  /** Adetten kaç gün önce hatırlatılsın; null → kapalı. */
  periodDaysBefore: number | null;
  /** Doğurgan dönemin ilk günü hatırlatılsın mı. */
  fertile: boolean;
}

/** Ücretsiz sürümde hatırlatmaların sabit saati; premium kendi saatini seçer. */
export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_PILL_HOUR = 21;
/** Seçilebilecek saatler. Dakika yok: az ama anlaşılır seçenek. */
export const REMINDER_HOURS: readonly number[] = [7, 8, 9, 12, 18, 20, 21, 22];

/** Kaç döngü ilerisi zamanlanır. Uygulama her açıldığında plan yenilenir. */
export const PLANNED_CYCLES = 3;

export function planReminders(
  cycles: readonly Cycle[],
  today: ISODate,
  options: ReminderOptions,
): PlannedReminder[] {
  if (cycles.length === 0) return [];
  if (options.periodDaysBefore === null && !options.fertile) return [];

  const stats = computeCycleStats(cycles);
  const predictions = predictUpcomingPeriods(cycles, stats, PLANNED_CYCLES, today);
  const plan: PlannedReminder[] = [];

  for (const prediction of predictions) {
    if (options.periodDaysBefore !== null) {
      plan.push({ kind: "period", date: addDays(prediction.startDate, -options.periodDaysBefore) });
    }
    if (options.fertile) {
      plan.push({ kind: "fertile", date: prediction.fertileWindowStart });
    }
  }

  // Bugün de dahil: saati geçmişse zamanlayıcı ayrıca eler.
  const unique = new Map(plan.filter((item) => item.date >= today).map((item) => [`${item.kind}:${item.date}`, item]));
  return [...unique.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
