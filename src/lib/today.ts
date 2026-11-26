import type { ISODate } from "@/core";

/**
 * Uygulamanın "bugün" tanımı — web'deki `lib/today.ts` ile aynı kural.
 *
 * Sabit bir IANA saat dilimine göre hesaplanır, elle `+3` değil: IANA
 * veritabanı Türkiye'nin 2016'da yaz saatini kaldırdığını bilir. Böylece
 * sunucu (UTC'de çalışır), web ve telefon aynı günü görür; gece yarısından
 * sonra girilen kayıt önceki güne yazılmaz.
 */
export const APP_TIME_ZONE = "Europe/Istanbul";

/** Türkiye 2016'dan beri sürekli UTC+3. Yalnızca Intl çalışmazsa kullanılır. */
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

function fromIntl(now: Date): ISODate | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    const value = `${pick("year")}-${pick("month")}-${pick("day")}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Hermes'te `Intl` saat dilimi desteği derlemeye göre eksik olabilir. O
 * durumda sabit UTC+3'e düşülür — bu YALNIZCA Türkiye için doğrudur; uygulama
 * başka bir ülkede kullanılacaksa bu yedek yanlış gün üretir.
 */
export function getToday(now: Date = new Date()): ISODate {
  return (
    fromIntl(now) ?? new Date(now.getTime() + ISTANBUL_OFFSET_MS).toISOString().slice(0, 10)
  );
}

/** Intl'in bu cihazda gerçekten çalışıp çalışmadığı — tanı amaçlı. */
export function isIntlTimeZoneSupported(): boolean {
  return fromIntl(new Date()) !== null;
}
