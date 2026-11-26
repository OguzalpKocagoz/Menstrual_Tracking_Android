/**
 * Tarih yardımcıları.
 *
 * Tasarım kararı: tarihler her yerde "YYYY-MM-DD" biçiminde düz string olarak
 * taşınır, asla `Date` nesnesi olarak. Sebebi: bir adet kaydı takvim günüdür,
 * zaman damgası değil. `Date` kullanmak, kullanıcı saat dilimi değiştirdiğinde
 * veya sunucu UTC'de çalıştığında kaydın bir gün kaymasına yol açar.
 *
 * Aritmetik daima UTC gün sayısı üzerinden yapılır; yaz saati uygulaması
 * hesabı etkilemez. Bu dosyanın hiçbir bağımlılığı yoktur ve React Native
 * tarafında olduğu gibi çalışır.
 */

export type ISODate = string;

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const WEEKDAY_LABELS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export const MONTH_LABELS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;

/**
 * "2026-02-30" gibi takvimde var olmayan tarihler de reddedilir.
 *
 * Tek başına `Date.parse` yeterli değildir: taşan gün numaralarını hata
 * vermek yerine sessizce sonraki aya kaydırır (2026-02-30 → 2026-03-02).
 * Bu yüzden tarih geri biçimlendirilip girdiyle karşılaştırılır.
 */
export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString().slice(0, 10) === value;
}

function assertISODate(value: ISODate): void {
  if (!isISODate(value)) {
    throw new TypeError(`Geçersiz tarih: ${String(value)} (beklenen biçim: YYYY-MM-DD)`);
  }
}

/** 1970-01-01'den itibaren geçen tam gün sayısı. */
export function toEpochDay(date: ISODate): number {
  assertISODate(date);
  return Math.round(Date.parse(`${date}T00:00:00.000Z`) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): ISODate {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** `to` - `from`, gün cinsinden. Sonuç negatif olabilir. */
export function daysBetween(from: ISODate, to: ISODate): number {
  return toEpochDay(to) - toEpochDay(from);
}

/** Aralık iki ucu da dahil olacak şekilde kaç gün sürer. */
export function inclusiveDayCount(from: ISODate, to: ISODate): number {
  return daysBetween(from, to) + 1;
}

export function compareDates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isBetween(date: ISODate, start: ISODate, end: ISODate): boolean {
  return date >= start && date <= end;
}

/**
 * Kullanıcının cihazındaki bugünün tarihi (yerel saat).
 * `now` parametresi testlerde tarihi sabitlemek için vardır.
 */
export function todayISO(now: Date = new Date()): ISODate {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYear(date: ISODate): number {
  return Number(date.slice(0, 4));
}

/** 1-12 arası. `Date.getMonth()` gibi 0 tabanlı değildir. */
export function getMonth(date: ISODate): number {
  return Number(date.slice(5, 7));
}

export function getDayOfMonth(date: ISODate): number {
  return Number(date.slice(8, 10));
}

/** Pazartesi = 0 ... Pazar = 6 (Türkiye'de haftanın başı pazartesidir). */
export function getWeekdayIndex(date: ISODate): number {
  const jsDay = new Date(`${date}T00:00:00.000Z`).getUTCDay(); // Pazar = 0
  return (jsDay + 6) % 7;
}

export function startOfMonth(year: number, month: number): ISODate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function endOfMonth(year: number, month: number): ISODate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(
    daysInMonth(year, month),
  ).padStart(2, "0")}`;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

/**
 * Takvim ızgarası: haftalar halinde, pazartesi başlangıçlı, komşu ayların
 * günleriyle doldurulmuş tam haftalar. Hem web hem mobil takvimi bunu kullanır.
 */
export function buildMonthGrid(year: number, month: number): ISODate[][] {
  const first = startOfMonth(year, month);
  const gridStart = addDays(first, -getWeekdayIndex(first));
  const weekCount = Math.ceil((getWeekdayIndex(first) + daysInMonth(year, month)) / 7);

  const weeks: ISODate[][] = [];
  for (let week = 0; week < weekCount; week++) {
    const days: ISODate[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(addDays(gridStart, week * 7 + day));
    }
    weeks.push(days);
  }
  return weeks;
}

export function formatDateTR(date: ISODate): string {
  const monthLabel = MONTH_LABELS_TR[getMonth(date) - 1] ?? "";
  return `${getDayOfMonth(date)} ${monthLabel} ${getYear(date)}`;
}

export function formatShortDateTR(date: ISODate): string {
  const monthLabel = MONTH_LABELS_TR[getMonth(date) - 1] ?? "";
  return `${getDayOfMonth(date)} ${monthLabel}`;
}

export function formatMonthTR(year: number, month: number): string {
  return `${MONTH_LABELS_TR[month - 1] ?? ""} ${year}`;
}

/** "3 gün sonra", "dün", "bugün" gibi göreli ifadeler. */
export function formatRelativeDaysTR(days: number): string {
  if (days === 0) return "bugün";
  if (days === 1) return "yarın";
  if (days === -1) return "dün";
  if (days > 1) return `${days} gün sonra`;
  return `${Math.abs(days)} gün önce`;
}
