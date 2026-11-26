import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  MaxAdContentRating,
  TestIds,
} from "react-native-google-mobile-ads";
import { usePremium } from "./premium";

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
 */

/**
 * AdMob'daki gerçek reklam birimi kimliği. AdMob hesabı açılıp uygulama
 * eklendiğinde buraya yazılacak (app.json'daki uygulama kimlikleri de).
 * Boşken yayın sürümünde de test reklamı gösterilir — gerçek gelir gelmez
 * ama geçersiz kimlikle hesap da riske girmez.
 */
const PRODUCTION_BANNER_ID = "";

const BANNER_ID = __DEV__ || !PRODUCTION_BANNER_ID ? TestIds.ADAPTIVE_BANNER : PRODUCTION_BANNER_ID;

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
function startSdk(): Promise<void> {
  sdkStarted ??= (async () => {
    await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.T });
    await mobileAds().initialize();
  })();
  return sdkStarted;
}

async function startIfAllowed(): Promise<boolean> {
  const { canRequestAds } = await AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;
  await startSdk();
  return true;
}

export function AdsProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { isPremium } = usePremium();
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(() => {
    if (isPremium || !enabled) return;
    let alive = true;

    const update = async () => {
      const started = await startIfAllowed();
      const info = await AdsConsent.getConsentInfo();
      if (!alive) return;
      setReady(started);
      setPrivacyOptionsRequired(
        info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
    };

    // Google'ın önerdiği sıra: rıza toplanırken önceki oturumdan kalan rızayla
    // paralel başlatmayı da dene; rıza formu hata verse bile önceki karar geçerli.
    AdsConsent.gatherConsent()
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
    await AdsConsent.showPrivacyOptionsForm();
    const started = await startIfAllowed().catch(() => false);
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
  if (!ready || failed) return null;
  return (
    <View style={styles.banner}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: "center" },
});
