import { useSettings } from "./settings";

/**
 * Premium (abonelik) şimdilik kapalı.
 *
 * Karar: uygulama reklamla ücretsiz yayınlanıyor, abonelik satılmıyor. Daha
 * önce premium'a ayrılan özellikler (Aurora teması, bildirim saati, hap
 * hatırlatması) herkese açık. Premium ekranı ve satın alma altyapısının kodu
 * duruyor; ileride abonelik eklenirse bu anahtarı açmak yeterli olacak.
 */
export const PREMIUM_ENABLED = false;

export interface PremiumState {
  /** Aktif abone mi. Aboneler reklam görmez. Premium kapalıyken hep false. */
  isPremium: boolean;
  /**
   * Premium'a ayrılan özellikler bu kullanıcıya açık mı. Premium kapalıyken
   * herkese açıktır; açıkken yalnızca abonelere.
   */
  featuresUnlocked: boolean;
}

export function usePremium(): PremiumState {
  const { settings } = useSettings();
  // Satın alma bağlanana kadar abonelik yalnızca geliştirme sürümündeki
  // anahtarla denenebilir; yayın sürümünde kimse abone sayılmaz.
  const isPremium = PREMIUM_ENABLED && __DEV__ && settings.devPremium;
  return { isPremium, featuresUnlocked: !PREMIUM_ENABLED || isPremium };
}
