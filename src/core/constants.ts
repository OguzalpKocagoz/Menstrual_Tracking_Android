/** Döngü hesaplarında kullanılan sabitler. Tek yerde toplanmıştır ki
 *  varsayımlar kodun içine dağılmasın. */

/** Hiç veri yokken varsayılan döngü uzunluğu. */
export const DEFAULT_CYCLE_LENGTH = 28;

/** Hiç veri yokken varsayılan regl süresi. */
export const DEFAULT_PERIOD_LENGTH = 5;

/**
 * Luteal faz (yumurtlama ile bir sonraki adetin başlangıcı arası) kişiden
 * kişiye pek değişmez ve yaklaşık 14 gündür. Yumurtlama tahmini bu yüzden
 * döngünün başından değil, bir sonraki adetin başlangıcından geriye sayılarak
 * yapılır — döngüsü uzun olan kullanıcılarda çok daha isabetli sonuç verir.
 */
export const LUTEAL_PHASE_LENGTH = 14;

/** Sperm yaklaşık 5 gün canlı kalabildiği için doğurgan pencere önden başlar. */
export const FERTILE_DAYS_BEFORE_OVULATION = 5;
export const FERTILE_DAYS_AFTER_OVULATION = 1;

/** Bu aralığın dışındaki döngüler veri girişi hatası sayılır ve
 *  istatistiklere katılmaz (ör. kullanıcının yanlış yıl seçmesi). */
export const MIN_PLAUSIBLE_CYCLE_LENGTH = 15;
export const MAX_PLAUSIBLE_CYCLE_LENGTH = 60;
export const MAX_PLAUSIBLE_PERIOD_LENGTH = 12;

/** Standart sapma bu değerin altındaysa döngü "düzenli" kabul edilir. */
export const REGULARITY_THRESHOLD_DAYS = 4;

/** İstatistikler yalnızca son N döngüden hesaplanır; yıllar önceki
 *  döngüler bugünkü tahmini bozmasın diye. */
export const RECENT_CYCLE_SAMPLE_SIZE = 6;

/** Tahminin "yüksek güvenilir" sayılması için gereken en az döngü sayısı. */
export const MIN_CYCLES_FOR_HIGH_CONFIDENCE = 3;
