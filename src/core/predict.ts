import {
  FERTILE_DAYS_AFTER_OVULATION,
  FERTILE_DAYS_BEFORE_OVULATION,
  LUTEAL_PHASE_LENGTH,
  MAX_PLAUSIBLE_PERIOD_LENGTH,
  MIN_CYCLES_FOR_HIGH_CONFIDENCE,
  MIN_PLAUSIBLE_CYCLE_LENGTH,
} from "./constants";
import { addDays, daysBetween, isBetween, todayISO, type ISODate } from "./date";
import { computeCycleStats, sortCycles } from "./stats";
import {
  CYCLE_PHASES,
  type Cycle,
  type CycleOverview,
  type CyclePhase,
  type CycleStats,
  type FertileDay,
  type FertilityLevel,
  type PeriodPrediction,
  type PhaseRange,
  type PredictionConfidence,
} from "./types";

/** İçinde bulunulan döngü: başlangıcı bugünü geçmeyen en yeni döngü. */
export function getCurrentCycle(cycles: readonly Cycle[], today: ISODate): Cycle | null {
  const sorted = sortCycles(cycles);
  for (let index = sorted.length - 1; index >= 0; index--) {
    const cycle = sorted[index];
    if (cycle && cycle.startDate <= today) return cycle;
  }
  return null;
}

/**
 * Kanamanın son günü. Kullanıcı bitişi işaretlememişse bugüne kadar devam
 * ettiği varsayılır; ancak "bitti" demeyi unutan kullanıcı yüzünden reglin
 * sonsuza kadar sürüyor görünmemesi için makul bir üst sınır uygulanır.
 */
function getPeriodEndBoundary(cycle: Cycle, today: ISODate): ISODate {
  if (cycle.periodEndDate) return cycle.periodEndDate;
  const cap = addDays(cycle.startDate, MAX_PLAUSIBLE_PERIOD_LENGTH - 1);
  return today < cap ? today : cap;
}

/** Verilen tarihin, kayıtlı döngülere göre gerçek bir regl günü olup olmadığı. */
export function isPeriodDay(
  date: ISODate,
  cycles: readonly Cycle[],
  today: ISODate = todayISO(),
): boolean {
  return getPeriodCycleForDate(date, cycles, today) !== null;
}

/**
 * Verilen günün kanama süresine denk geldiği döngü. Denk gelmiyorsa null.
 *
 * Arayüz bunu, seçilen gün için hangi işlemin sunulacağına karar vermek üzere
 * kullanır: gün bir dönemin içindeyse "bitişi bu gün olarak işaretle",
 * değilse "adetim bu gün başladı".
 */
export function getPeriodCycleForDate(
  date: ISODate,
  cycles: readonly Cycle[],
  today: ISODate = todayISO(),
): Cycle | null {
  return (
    cycles.find((cycle) =>
      isBetween(date, cycle.startDate, getPeriodEndBoundary(cycle, today)),
    ) ?? null
  );
}

/** Verilen günde başlayan döngü kaydı. */
export function getCycleStartingOn(
  date: ISODate,
  cycles: readonly Cycle[],
): Cycle | null {
  return cycles.find((cycle) => cycle.startDate === date) ?? null;
}

/** Döngünün kaçıncı günü (ilk gün = 1). Tarih ilk kayıttan önceyse null. */
export function getCycleDay(
  date: ISODate,
  cycles: readonly Cycle[],
): number | null {
  const cycle = getCurrentCycle(cycles, date);
  if (!cycle) return null;
  return daysBetween(cycle.startDate, date) + 1;
}

function resolveConfidence(stats: CycleStats): PredictionConfidence {
  if (stats.usingDefaults) return "low";
  if (stats.observedCycleCount >= MIN_CYCLES_FOR_HIGH_CONFIDENCE && stats.isRegular) {
    return "high";
  }
  if (stats.observedCycleCount >= 2) return "medium";
  return "low";
}

function buildPrediction(startDate: ISODate, stats: CycleStats): PeriodPrediction {
  const periodLength = Math.max(1, Math.round(stats.averagePeriodLength));

  // Yumurtlama, döngünün başından ileri sayılarak değil, adetin başlangıcından
  // geriye sayılarak bulunur — luteal faz sabite yakın olduğu için daha isabetli.
  const ovulationDate = addDays(startDate, -LUTEAL_PHASE_LENGTH);

  return {
    startDate,
    endDate: addDays(startDate, periodLength - 1),
    ovulationDate,
    fertileWindowStart: addDays(ovulationDate, -FERTILE_DAYS_BEFORE_OVULATION),
    fertileWindowEnd: addDays(ovulationDate, FERTILE_DAYS_AFTER_OVULATION),
    confidence: resolveConfidence(stats),
  };
}

/**
 * Sıradaki adet dönemleri. Geçmişte kalmış tahminler atlanır; ancak süresi
 * dolmamış (yani gecikmiş) bir tahmin listenin başında kalır ki arayüz
 * "adetin X gün gecikti" diyebilsin.
 */
export function predictUpcomingPeriods(
  cycles: readonly Cycle[],
  stats: CycleStats,
  count = 3,
  today: ISODate = todayISO(),
): PeriodPrediction[] {
  const sorted = sortCycles(cycles);
  const lastCycle = sorted[sorted.length - 1];
  if (!lastCycle) return [];

  const cycleLength = Math.max(
    MIN_PLAUSIBLE_CYCLE_LENGTH,
    Math.round(stats.medianCycleLength),
  );

  const predictions: PeriodPrediction[] = [];
  // Üst sınır, kullanıcı uzun süre kayıt girmediğinde döngünün sonsuza gitmemesi için.
  const maxIterations = count + 60;

  for (let step = 1; step <= maxIterations && predictions.length < count; step++) {
    const startDate = addDays(lastCycle.startDate, cycleLength * step);
    const prediction = buildPrediction(startDate, stats);
    if (prediction.endDate < today) continue;
    predictions.push(prediction);
  }

  return predictions;
}

/**
 * Yumurtlamanın döngünün kaçıncı gününe denk geldiği.
 *
 * Sondan geriye sayılır: luteal faz sabite yakındır, foliküler faz değişkendir.
 *
 * `+ 1` gözden kaçması kolay ama şart: döngünün ilk günü 1'dir, 0 değil.
 * 28 günlük bir döngüde sonraki adet 29. günde başlar; ondan 14 gün geriye
 * gidince 15. güne varılır. `+ 1` olmadan sonuç 14 çıkıyor ve tahmin edilen
 * yumurtalama tarihi ile faz tablosu bir gün kayıyordu — ekranda yumurtlama
 * günü, yumurtlama bandının ortasında değil son gününde görünüyordu.
 */
export function getOvulationCycleDay(cycleLength: number): number {
  return cycleLength - LUTEAL_PHASE_LENGTH + 1;
}

/**
 * Faz belirlemenin tek kaynağı.
 *
 * Hem tek bir günün fazını bulan `getPhaseForDate` hem de tüm fazların gün
 * aralıklarını çıkaran `getPhaseRanges` bu fonksiyona dayanır; böylece
 * ekranda gösterilen aralıklarla o günün fazı asla çelişemez.
 */
export function getPhaseForCycleDay(
  cycleDay: number,
  cycleLength: number,
  periodLength: number,
): CyclePhase {
  if (cycleDay <= periodLength) return "menstrual";

  const ovulationDay = getOvulationCycleDay(cycleLength);
  if (Math.abs(cycleDay - ovulationDay) <= 1) return "ovulation";
  return cycleDay < ovulationDay ? "follicular" : "luteal";
}

function resolveCycleLength(stats: CycleStats): number {
  return Math.max(MIN_PLAUSIBLE_CYCLE_LENGTH, Math.round(stats.medianCycleLength));
}

/**
 * Dört fazın da döngü içindeki gün aralığı.
 *
 * Sonuç daima dört öğe içerir ve faz sırasındadır. Bir faz hiç
 * gerçekleşmiyorsa (ör. çok uzun kanama foliküler fazı yutarsa) `dayCount`
 * sıfır olur; arayüz onu yine de listeleyip boş gösterebilsin diye öğe
 * listeden düşürülmez.
 */
export function getPhaseRanges(stats: CycleStats): PhaseRange[] {
  const cycleLength = resolveCycleLength(stats);
  const periodLength = Math.max(1, Math.round(stats.averagePeriodLength));

  const phaseOfDay: CyclePhase[] = [];
  for (let day = 1; day <= cycleLength; day++) {
    phaseOfDay.push(getPhaseForCycleDay(day, cycleLength, periodLength));
  }

  return CYCLE_PHASES.map((phase) => {
    const days = phaseOfDay
      .map((value, index) => (value === phase ? index + 1 : 0))
      .filter((day) => day > 0);

    if (days.length === 0) {
      return { phase, startDay: 0, endDay: 0, dayCount: 0 };
    }
    return {
      phase,
      startDay: Math.min(...days),
      endDay: Math.max(...days),
      dayCount: days.length,
    };
  });
}

/**
 * Bir tarihin hangi döngü fazına düştüğü.
 * Kayıt yoksa null döner — uydurma bir faz göstermektense hiçbir şey göstermemek daha doğru.
 */
export function getPhaseForDate(
  date: ISODate,
  cycles: readonly Cycle[],
  stats: CycleStats,
): CyclePhase | null {
  const cycle = getCurrentCycle(cycles, date);
  if (!cycle) return null;

  const cycleDay = daysBetween(cycle.startDate, date) + 1;

  // Bitiş işaretlenmişse gerçek süre, değilse ortalama kullanılır.
  const periodLength = cycle.periodEndDate
    ? daysBetween(cycle.startDate, cycle.periodEndDate) + 1
    : Math.max(1, Math.round(stats.averagePeriodLength));

  return getPhaseForCycleDay(cycleDay, resolveCycleLength(stats), periodLength);
}

/**
 * Verilen günde gebe kalma ihtimalinin göreli seviyesi.
 *
 * Ölçek yumurtlama gününe göre kurulur: sperm 5 güne kadar canlı kalabildiği
 * için ihtimal yumurtlamadan önceki günlerde birikir; yumurtlanan hücre
 * yaklaşık bir gün yaşadığı için sonrasında hızla düşer. En yüksek ihtimal,
 * yumurtlama günü ile bir önceki gündür.
 *
 * Bu bir tahmindir: gerçek yumurtlama günü döngüden döngüye kayabilir.
 * Doğum kontrolü amacıyla kullanılamaz.
 */
export function getFertilityLevel(
  date: ISODate,
  prediction: Pick<PeriodPrediction, "ovulationDate">,
): FertilityLevel {
  const offset = daysBetween(prediction.ovulationDate, date);

  if (offset === 0 || offset === -1) return "peak";
  if (offset === -2 || offset === -3) return "high";
  if (offset === -4 || offset === -5) return "medium";
  if (offset === 1) return "low";
  return "none";
}

/**
 * Doğurgan pencerenin günlerini, her biri için ihtimal seviyesiyle birlikte
 * döndürür. Arayüz bunu doğrudan listeler; hesap yapmaz.
 */
export function getFertileWindowDays(prediction: PeriodPrediction): FertileDay[] {
  const days: FertileDay[] = [];
  const total = daysBetween(prediction.fertileWindowStart, prediction.fertileWindowEnd);

  for (let index = 0; index <= total; index++) {
    const date = addDays(prediction.fertileWindowStart, index);
    days.push({
      date,
      level: getFertilityLevel(date, prediction),
      isOvulation: date === prediction.ovulationDate,
      offsetFromOvulation: daysBetween(prediction.ovulationDate, date),
    });
  }
  return days;
}

/** Doğurgan pencereye kaç gün kaldığı. İçindeysek 0, geçtiyse negatif. */
export function getDaysUntilFertileWindow(
  today: ISODate,
  prediction: PeriodPrediction,
): number {
  if (today < prediction.fertileWindowStart) {
    return daysBetween(today, prediction.fertileWindowStart);
  }
  if (today > prediction.fertileWindowEnd) {
    return daysBetween(today, prediction.fertileWindowEnd);
  }
  return 0;
}

/**
 * Ana ekranın ihtiyaç duyduğu her şeyi tek seferde hesaplar.
 * Arayüz katmanı bu fonksiyonun çıktısını doğrudan ekrana basar; hesap yapmaz.
 */
export function buildCycleOverview(
  cycles: readonly Cycle[],
  today: ISODate = todayISO(),
): CycleOverview {
  const stats = computeCycleStats(cycles);
  const currentCycle = getCurrentCycle(cycles, today);
  const [nextPeriod = null] = predictUpcomingPeriods(cycles, stats, 1, today);

  return {
    today,
    currentCycleStart: currentCycle?.startDate ?? null,
    cycleDay: currentCycle ? daysBetween(currentCycle.startDate, today) + 1 : null,
    phase: getPhaseForDate(today, cycles, stats),
    isOnPeriod: isPeriodDay(today, cycles, today),
    nextPeriod,
    daysUntilNextPeriod: nextPeriod ? daysBetween(today, nextPeriod.startDate) : null,
    isFertileToday: nextPeriod
      ? isBetween(today, nextPeriod.fertileWindowStart, nextPeriod.fertileWindowEnd)
      : false,
    stats,
  };
}
