import type { ISODate } from "@/core";

/**
 * Uygulamanın "bugün" tanımı: telefonun kendi saat dilimindeki takvim günü.
 *
 * Veri yalnızca telefonda tutulduğu için sabit bir saat dilimine (eskiden
 * Europe/Istanbul) gerek yok; kullanıcı hangi ülkedeyse orada gece yarısı yeni
 * gün başlar. Yerel tarih alanları (`getFullYear` vb.) Intl'e ihtiyaç duymadan
 * her cihazda çalışır ve telefonun saat dilimi ayarını izler. Yolculukta saat
 * dilimi değişirse "bugün" de yeni yere göre güncellenir.
 *
 * İleride hesaplar sunucuyla eşitlendiğinde de tarih telefonda ISO gün olarak
 * üretilip öyle gönderilir; sunucu kendi saatiyle gün hesaplamaz.
 */
export function getToday(now: Date = new Date()): ISODate {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
