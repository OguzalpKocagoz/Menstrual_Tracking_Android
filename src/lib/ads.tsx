import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isRunningInExpoGo } from "expo";
import { Platform, StyleSheet, View } from "react-native";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { usePremium } from "./premium";

type AdsModule = typeof import("react-native-google-mobile-ads");

/**
 * Reklam modülü yalnızca kendi derlememizde yüklenir. Expo Go'nun içinde
 * Google reklam modülü yok; statik import edilse uygulama Expo Go'da açılışta
 * çökerdi. Expo Go'da (telefonda hızlı deneme) reklam hiç gösterilmez, geri
 * kalan her şey çalışır.
 */
const Ads: AdsModule | null = isRunningInExpoGo()
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("react-native-google-mobile-ads") as AdsModule);

/**
 * Reklamlar (AdMob).
 *
 * Kurallar — bu bir sağlık uygulaması olduğu için bilerek sıkı:
 * - **Sağlık verisi reklama gitmez.** Reklam isteğine hiçbir anahtar kelime,
 *   içerik bağlantısı ya da kayıt bilgisi eklenmez; AdMob yalnızca standart
 *   cihaz sinyallerini görür.
 * - **Rıza önce.** AB/EEA ve benzeri bölgelerde Google'ın rıza formu (UMP)
 *   gösterilir; `canRequestAds` false iken SDK başlatılmaz, reklam istenmez.
 *   Ölçüm de rızaya kadar ertelenir (`delayAppMeasurementInit`, app.json).
 * - **Yetişkin içerik yok.** Kullanıcıların bir kısmı reşit olmayabilir; reklam
 *   içerik düzeyi "T" (genç) ile sınırlanır.
 * - **Rahatsız etmeyen yerleşim.** Yalnızca ikincil ekranların altında sabit
 *   banner. Tam ekran (interstitial) reklam yok; kayıt girerken, kilit ve
 *   karşılama ekranlarında reklam yok.
 * - Premium kullanıcı hiç reklam görmez; SDK onlar için başlatılmaz bile.
 * - iPhone'da Apple'ın takip izni (ATT) rıza formundan SONRA, SDK başlamadan
 *   önce sorulur. Reddedilirse de reklam gösterilir, yalnızca kişiselleştirilmez.
 */

/**
 * AdMob'daki gerçek reklam birimi kimliği. AdMob hesabı açılıp uygulama
 * eklendiğinde buraya yazılacak (app.json'daki uygulama kimlikleri de).
 * Boşken yayın sürümünde de test reklamı gösterilir — gerçek gelir gelmez
 * ama geçersiz kimlikle hesap da riske girmez.
 */
const PRODUCTION_BANNER_ID = "";

function bannerId(ads: AdsModule): string {
  return __DEV__ || !PRODUCTION_BANNER_ID ? ads.TestIds.ADAPTIVE_BANNER : PRODUCTION_BANNER_ID;
}

interface AdsValue {
  /** Rıza alındı ve SDK başlatıldı; banner istenebilir. */
  ready: boolean;
  /** Kullanıcının bölgesinde gizlilik seçenekleri formu gösterilmeli mi (GDPR). */
  privacyOptionsRequired: boolean;
  /** Reklam gizlilik tercihlerini yeniden açar. */
  openPrivacyOptions: () => Promise<void>;
}

const AdsContext = createContext<AdsValue>({
  ready: false,
  privacyOptionsRequired: false,
  openPrivacyOptions: async () => {},
});

let sdkStarted: Promise<void> | null = null;

/** SDK yalnızca bir kez başlatılır. */
function startSdk(ads: AdsModule): Promise<void> {
  sdkStarted ??= (async () => {
    await ads.default().setRequestConfiguration({ maxAdContentRating: ads.MaxAdContentRating.T });
    await ads.default().initialize();
  })();
  return sdkStarted;
}

let trackingAsked: Promise<unknown> | null = null;

async function startIfAllowed(ads: AdsModule): Promise<boolean> {
  const { canRequestAds } = await ads.AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;
  if (Platform.OS === "ios") {
    // Bir kez sorulur; sistem ikinci kez pencere göstermez, sonucu hatırlar.
    trackingAsked ??= requestTrackingPermissionsAsync().catch(() => undefined);
    await trackingAsked;
  }
  await startSdk(ads);
  return true;
}

export function AdsProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { isPremium } = usePremium();
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(() => {
    const ads = Ads;
    if (!ads || isPremium || !enabled) return;
    let alive = true;

    const update = async () => {
      const started = await startIfAllowed(ads);
      const info = await ads.AdsConsent.getConsentInfo();
      if (!alive) return;
      setReady(started);
      setPrivacyOptionsRequired(
        info.privacyOptionsRequirementStatus === ads.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
    };

    // Google'ın önerdiği sıra: rıza toplanırken önceki oturumdan kalan rızayla
    // paralel başlatmayı da dene; rıza formu hata verse bile önceki karar geçerli.
    ads.AdsConsent.gatherConsent()
      .catch(() => undefined)
      .finally(() => {
        update().catch(() => {});
      });
    update().catch(() => {});

    return () => {
      alive = false;
    };
  }, [isPremium, enabled]);

  const openPrivacyOptions = useCallback(async () => {
    if (!Ads) return;
    await Ads.AdsConsent.showPrivacyOptionsForm();
    const started = await startIfAllowed(Ads).catch(() => false);
    setReady(started);
  }, []);

  const value = useMemo(
    () => ({ ready: ready && !isPremium, privacyOptionsRequired, openPrivacyOptions }),
    [ready, isPremium, privacyOptionsRequired, openPrivacyOptions],
  );
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsValue {
  return useContext(AdsContext);
}

/**
 * Ekranın altına sabitlenen uyarlanabilir banner. Reklam yüklenemezse (ör.
 * envanter yok, çevrimdışı) yer kaplamaz.
 */
export function AdBanner() {
  const { ready } = useAds();
  const [failed, setFailed] = useState(false);
  if (!Ads || !ready || failed) return null;
  const { BannerAd, BannerAdSize } = Ads;
  return (
    <View style={styles.banner}>
      <BannerAd
        unitId={bannerId(Ads)}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: "center" },
});
