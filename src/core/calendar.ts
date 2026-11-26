import { isBetween, todayISO, type ISODate } from "./date";
import { isPeriodDay, predictUpcomingPeriods } from "./predict";
import { computeCycleStats } from "./stats";
import type { Cycle, CycleStats } from "./types";

/**
 * Takvimde tek bir günün nasıl boyanacağını anlatan bayraklar.
 * Web ve mobil takvimleri aynı işaretleri kullanır; yalnızca çizim biçimleri farklıdır.
 */
export interface DayMarker {
  date: ISODate;
  isToday: boolean;
  isFuture: boolean;
  /** Kullanıcının girdiği gerçek kayda dayanan regl günü. */
  inPeriod: boolean;
  /** Yalnızca tahmine dayanan regl günü. */
  predictedPeriod: boolean;
  fertile: boolean;
  isOvulation: boolean;
  /** O güne ait bir günlük kaydı var mı (nokta göstergesi için). */
  hasLog: boolean;
}

export interface DayMarkerInput {
  cycles: readonly Cycle[];
  /** Günlük kaydı bulunan tarihler. */
  loggedDates?: Iterable<ISODate>;
  stats?: CycleStats;
  today?: ISODate;
  /** Kaç adet dönemlik ileri tahmin üretileceği (yaklaşık bir yıl için 13 yeterli). */
  predictionCount?: number;
}

export function buildDayMarkers(
  dates: readonly ISODate[],
  input: DayMarkerInput,
): Map<ISODate, DayMarker> {
  const today = input.today ?? todayISO();
  const stats = input.stats ?? computeCycleStats(input.cycles);
  const loggedDates = new Set(input.loggedDates ?? []);
  const predictions = predictUpcomingPeriods(
    input.cycles,
    stats,
    input.predictionCount ?? 13,
    today,
  );

  const markers = new Map<ISODate, DayMarker>();

  for (const date of dates) {
    const inPeriod = isPeriodDay(date, input.cycles, today);

    let predictedPeriod = false;
    let fertile = false;
    let isOvulation = false;

    for (const prediction of predictions) {
      if (isBetween(date, prediction.startDate, prediction.endDate)) predictedPeriod = true;
      if (isBetween(date, prediction.fertileWindowStart, prediction.fertileWindowEnd)) {
        fertile = true;
      }
      if (date === prediction.ovulationDate) isOvulation = true;
    }

    markers.set(date, {
      date,
      isToday: date === today,
      isFuture: date > today,
      inPeriod,
      // Gerçek kayıt varken tahmin gösterilmez; ikisi aynı anda boyanmaz.
      predictedPeriod: predictedPeriod && !inPeriod,
      /**
       * Doğurganlık, regl günlerinde de bildirilir.
       *
       * Önce bastırılıyordu ve uzun döngülerde bunun bir bedeli yoktu, çünkü
       * doğurgan pencere zaten kanamayla çakışmaz. Ama kısa döngüde çakışır:
       * 23 günlük döngüde pencere 5. günde başlar, kanama da 5. günde biter.
       * Sperm birkaç gün canlı kaldığı için bu günler gerçekten doğurgandır ve
       * "regl sırasında gebelik olmaz" yaygın yanlış bilgisi tam da bu grup
       * için tehlikelidir. Bilgiyi gizlemek, göstermemekten farklı bir şeydir.
       */
      fertile,
      isOvulation,
      hasLog: loggedDates.has(date),
    });
  }

  return markers;
}
