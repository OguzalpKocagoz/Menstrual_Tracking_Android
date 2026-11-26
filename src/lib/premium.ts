import { useSettings } from "./settings";

/**
 * Premium durumu.
 *
 * Google Play Billing (RevenueCat) bağlandığında abonelik doğrulaması buraya
 * gelecek. Reklamlar, temalar ve hatırlatmalar yalnızca bu kancaya baktığı
 * için başka bir yeri değiştirmek gerekmeyecek.
 *
 * O zamana kadar premium yalnızca geliştirme sürümünde, Ayarlar'daki
 * geliştirici anahtarıyla açılır; yayın sürümünde herkes ücretsizdir.
 */
export function usePremium(): { isPremium: boolean } {
  const { settings } = useSettings();
  return { isPremium: __DEV__ && settings.devPremium };
}
