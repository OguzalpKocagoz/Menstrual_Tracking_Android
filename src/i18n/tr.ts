import type {
  AppTheme,
  CyclePhase,
  FertilityLevel,
  FlowIntensity,
  Mood,
  Symptom,
} from "@/core";

/**
 * Türkçe metinler — bütün dillerin şablonu.
 *
 * `Messages` türü bu nesneden türetilir; diğer diller aynı yapıyı eksiksiz
 * doldurmak zorunda. Bir metin eklenip çevirisi unutulursa typecheck hata
 * verir, uygulama yarı Türkçe yarı İngilizce yayına çıkmaz.
 *
 * Sayı içeren metinler fonksiyondur: dilbilgisi (çoğul, sıra sayısı, kelime
 * sırası) dilden dile değiştiği için cümle parçaları birleştirilmez, cümle
 * bütün olarak burada kurulur.
 */
/** Etiket tablosu: bütün anahtarlar zorunlu, değer türü dilden bağımsız. */
function record<K extends string, V>(value: Record<K, V>): Record<K, V> {
  return value;
}

export const tr = {
  common: {
    appName: "Döngüm",
    cancel: "Vazgeç",
    delete: "Sil",
    save: "Kaydet",
    saved: "Kaydedildi.",
    retry: "Tekrar dene",
    edit: "Düzenle",
    days: (n: number) => `${n} gün`,
  },

  dates: {
    months: [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ],
    /** Pazartesiden başlar; takvim ızgarası da pazartesi başlangıçlı. */
    weekdaysShort: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    long: (day: number, month: string, year: number) => `${day} ${month} ${year}`,
    short: (day: number, month: string) => `${day} ${month}`,
    monthYear: (month: string, year: number) => `${month} ${year}`,
    /** Tam saat: "09.00" */
    time: (hour: number) => `${String(hour).padStart(2, "0")}.00`,
    relative: (days: number) => {
      if (days === 0) return "bugün";
      if (days === 1) return "yarın";
      if (days === -1) return "dün";
      if (days > 1) return `${days} gün sonra`;
      return `${Math.abs(days)} gün önce`;
    },
  },

  errors: {
    unexpected: "Beklenmeyen bir hata oluştu.",
    loadFailed: "Veriler yüklenemedi.",
    saveFailed: "Kaydedilemedi.",
    invalidDate: "Geçersiz tarih.",
    cycleNotFound: "Döngü bulunamadı.",
    noCycleToEnd: "Bitirilecek bir döngü bulunamadı.",
    futureStart: "Gelecek bir tarihe adet başlangıcı girilemez.",
    endBeforeStart: "Kanama bitişi başlangıçtan önce olamaz.",
    periodTooLong: (max: number) => `Kanama ${max} günden uzun olamaz.`,
    invalidFlow: "Geçersiz kanama yoğunluğu.",
    invalidMood: "Geçersiz ruh hâli.",
    temperatureRange: "Sıcaklık 34–43 °C arasında olmalı.",
    lengthRange: (field: "cycleLength" | "periodLength", min: number, max: number) =>
      `${field === "cycleLength" ? "Döngü uzunluğu" : "Regl süresi"} ${min}–${max} gün arasında olmalı.`,
  },

  labels: {
    flow: record<FlowIntensity, string>({
      spotting: "Lekelenme",
      light: "Az",
      medium: "Orta",
      heavy: "Yoğun",
    }),
    mood: record<Mood, string>({
      great: "Çok iyi",
      good: "İyi",
      neutral: "Normal",
      low: "Düşük",
      irritable: "Sinirli",
      anxious: "Kaygılı",
    }),
    symptom: record<Symptom, string>({
      cramps: "Kramp",
      headache: "Baş ağrısı",
      bloating: "Şişkinlik",
      backache: "Sırt/bel ağrısı",
      tender_breasts: "Göğüs hassasiyeti",
      acne: "Sivilce",
      fatigue: "Yorgunluk",
      nausea: "Bulantı",
      insomnia: "Uykusuzluk",
      cravings: "Yeme isteği",
    }),
    /**
     * Faz adları. Tıbbi terim esas alınır çünkü kullanıcı kaynaklarda bu
     * adlarla karşılaşır; gündelik karşılığı `phaseAlias` ile parantez içinde
     * gösterilir.
     */
    phase: record<CyclePhase, string>({
      menstrual: "Menstrüasyon",
      follicular: "Foliküler faz",
      ovulation: "Ovülasyon",
      luteal: "Luteal faz",
    }),
    /** Gündelik karşılığı; tıbbi adla aynı olan fazlarda null. */
    phaseAlias: record<CyclePhase, string | null>({
      menstrual: "Regl dönemi",
      follicular: null,
      ovulation: "Yumurtlama",
      luteal: null,
    }),
    fertility: record<FertilityLevel, string>({
      peak: "En yüksek",
      high: "Yüksek",
      medium: "Orta",
      low: "Düşük",
      none: "Çok düşük",
    }),
    theme: record<AppTheme, string>({
      rose: "Gül",
      bloom: "Lavanta",
      ocean: "Okyanus",
      forest: "Orman",
      aurora: "Aurora",
    }),
  },

  tabs: {
    today: "Bugün",
    calendar: "Takvim",
    fertility: "Doğurganlık",
    stats: "İstatistik",
    settings: "Ayarlar",
    day: "Gün",
  },

  /** Tıbbi uyarı: ilk açılışta onaylatılır, Ayarlar'da da kalıcı görünür. */
  disclaimer:
    "Döngüm yalnızca kişisel takip amaçlıdır; tıbbi tavsiye, teşhis veya tedavinin yerine geçmez. " +
    "Tahminler geçmiş kayıtlarına dayanan yaklaşık hesaplardır ve doğum kontrolü yöntemi olarak " +
    "kullanılamaz. Sağlığınla ilgili kararlar için bir doktora danış.",

  /** Doğurganlık bilgisinin gösterildiği her yerde. */
  contraception:
    "Bu bir tahmindir; gerçek yumurtlama günü döngüden döngüye kayar. Doğum kontrolü amacıyla kullanılamaz.",

  welcome: {
    tagline: "Adet döngünü takip et, sıradaki dönemini önceden gör.",
    localData:
      "Kayıtların yalnızca bu telefonda saklanır; hesap açman gerekmez ve verilerin hiçbir sunucuya gönderilmez.",
    understood: "Okudum ve anladım.",
    start: "Başla",
  },

  ring: {
    cycleDay: (n: number) => `${n}. gün`,
  },

  phaseStrip: {
    day: (n: number) => `${n}. gün`,
    range: (from: number, to: number) => `${from}–${to}. gün`,
  },

  today: {
    endedToday: "Adet dönemin bugün bitti",
    onPeriod: "Adet dönemindesin",
    noData: "Henüz kayıt yok",
    noDataHint: "İlk adetini işaretle",
    daysUntil: (n: number) => `Adetine ${n} gün`,
    dueToday: "Adetin bugün bekleniyor",
    late: (n: number) => `Adetin ${n} gün gecikti`,
    endMarkedToday: "Bitişi bugün olarak işaretledin.",
    undo: "Geri al",
    periodEnded: "Adetim bitti",
    periodStarted: "Adetim başladı",
    nextPeriod: "Sıradaki adet",
    estimateNote: "Tahmini değer: yeterli kayıt olunca isabet artar.",
    phases: "Döngü fazları",
    todayLog: "Bugünün kaydı",
    flowLine: (value: string) => `Kanama: ${value}`,
    moodLine: (value: string) => `Ruh hâli: ${value}`,
    symptomsLine: (value: string) => `Belirtiler: ${value}`,
    temperatureLine: (value: string) => `Bazal sıcaklık: ${value} °C`,
    noLog: "Bugün için kayıt yok.",
    addLog: "Kayıt ekle",
  },

  calendar: {
    previousMonth: "Önceki ay",
    nextMonth: "Sonraki ay",
    legendPeriod: "Adet (kayıt)",
    legendPredicted: "Tahmini adet",
    legendFertile: "Doğurgan pencere",
    legendOvulation: "Tahmini yumurtlama",
    tapHint: "Bir güne dokunarak kayıt ekleyebilirsin.",
  },

  fertility: {
    needPeriod: "Doğurgan pencereyi tahmin etmek için önce bir adet başlangıcı kaydet.",
    window: "Doğurgan pencere",
    opensIn: (days: number) =>
      days === 1 ? "Pencere yarın açılıyor." : `Pencere ${days} gün sonra açılıyor.`,
    inWindow: "Şu an doğurgan penceredesin.",
    passed: "Bu döngünün penceresi geçti.",
    ovulation: "Tahmini yumurtlama: ",
    estimateNote: "Tahmini değer: henüz yeterli kayıt yok.",
    byDay: "Günlere göre ihtimal",
    ovulationTag: " · yumurtlama",
    todayTag: " · bugün",
  },

  stats: {
    cycle: "Döngü",
    average: "Ortalama döngü",
    median: "Medyan döngü",
    shortest: "En kısa",
    longest: "En uzun",
    averagePeriod: "Ortalama regl süresi",
    regularity: "Düzenlilik",
    notYet: "Henüz belli değil",
    regular: (variation: number) => `Düzenli (±${variation} gün)`,
    variable: (variation: number) => `Değişken (±${variation} gün)`,
    counted: "Hesaba giren döngü",
    estimateNote: "* Tahmini değer: en az iki adet başlangıcı kaydedince gerçek değerler görünür.",
    history: "Döngü geçmişi",
    noHistory: "Henüz döngü kaydı yok.",
    cycleLength: (n: number) => `${n} günlük döngü`,
    ongoing: "Devam ediyor",
    bleeding: (n: number) => `${n} gün kanama`,
    noEnd: "bitiş işaretlenmedi",
    longPressHint: "Silmek için bir döngüye basılı tut.",
    deleteTitle: "Döngüyü sil",
    deleteBody: (date: string) => `${date} başlangıçlı döngü silinsin mi? Bu geri alınamaz.`,
  },

  day: {
    period: "Adet",
    futureNote: "Gelecek bir güne adet başlangıcı girilemez.",
    endedThisDay: "Kanama bu gün bitti olarak işaretli.",
    endHere: "Bitişi bu güne al",
    startHere: "Adetim bu gün başladı",
    deleteStart: "Bu güne girilen başlangıcı sil",
    deleteTitle: "Döngüyü sil",
    deleteBody: "Bu güne girilen adet başlangıcı silinsin mi?",
    flow: "Kanama yoğunluğu",
    mood: "Ruh hâli",
    symptoms: "Belirtiler",
    temperature: "Bazal sıcaklık (°C)",
    temperaturePlaceholder: "36,6",
    note: "Not",
  },

  settings: {
    theme: "Tema",
    themeA11y: (name: string) => `${name} teması`,
    language: "Dil",
    languageAuto: "Otomatik",
    languageAutoHint: "Otomatik seçiliyken telefonunun dili kullanılır.",
    lengths: "Varsayılan uzunluklar",
    lengthsHint: "Boş bırakılırsa kayıtlarından hesaplanır.",
    cycleLength: "Döngü uzunluğu (gün)",
    periodLength: "Regl süresi (gün)",
    privacy: "Gizlilik",
    appLock: "Uygulama kilidi",
    appLockHint: "Açılışta ve uygulamaya geri döndüğünde telefonunun kilidi (parmak izi, yüz ya da PIN) sorulur.",
    noDeviceLock: "Önce telefonunun ayarlarından bir ekran kilidi (PIN, desen ya da parmak izi) kur.",
    lockPromptOn: "Uygulama kilidini aç",
    lockPromptOff: "Uygulama kilidini kapat",
    lockFailed: "Kilit ayarlanamadı.",
    adPrivacy: "Reklam gizlilik tercihleri",
    reminders: "Hatırlatmalar",
    beforePeriod: "Adet başlangıcından önce",
    off: "Kapalı",
    fertileStart: "Doğurgan dönem başlarken",
    remindersHint:
      "Kilit ekranında görünebilecekleri için bildirim metinleri bilerek genel tutulur; adet ya da doğurganlık yazmaz.",
    reminderTime: "Bildirim saati",
    reminderTimeFree: (time: string) => `Ücretsiz sürümde saat sabit: ${time}`,
    pill: "Günlük hap hatırlatması",
    pillHint: "Her gün seçtiğin saatte nötr bir bildirim gelir.",
    pillTime: "Hap saati",
    premiumLocked: "Bu özellik Premium'a dahil.",
    premiumTitle: "Premium",
    premiumActive: "Premium aktif. Teşekkürler!",
    premiumHint: "Reklamsız kullanım, partner bağlama, ek temalar ve gelişmiş hatırlatmalar.",
    premiumCta: "Premium'a geç",
    devPremium: "Geliştirici: Premium'u dene",
    permissionDenied: "Bildirim izni verilmedi. Telefonun ayarlarından Döngüm için bildirimlere izin ver.",
    data: "Verilerin",
    dataHint:
      "Kayıtların yalnızca bu telefonda saklanır, hiçbir sunucuya gönderilmez. Uygulamayı silersen kayıtlar da silinir; telefonunun Google yedeği açıksa yeni telefona geri yüklenir.",
    deleteAll: "Tüm kayıtları sil",
    deleteAllBody: "Bu telefondaki bütün döngü ve günlük kayıtların kalıcı olarak silinecek. Geri alınamaz.",
  },

  lock: {
    prompt: "Döngüm'ü aç",
    locked: "Kayıtların kilitli.",
    unlock: "Kilidi aç",
  },

  /**
   * Bildirim metinleri bilerek nötr: kilit ekranında ve başkalarının
   * görebileceği yerlerde çıkar; "adet" ya da "doğurgan" kelimesi sağlık
   * bilgisini açık eder.
   */
  notifications: {
    channel: "Hatırlatmalar",
    period: "Takviminde yaklaşan bir gün var.",
    fertile: "Takviminde bugün yeni bir dönem başlıyor.",
    pill: "Günlük hatırlatma zamanı.",
  },

  premium: {
    title: "Döngüm Premium",
    subtitle: "Döngünü reklamsız takip et, partnerinle paylaş.",
    features: [
      { title: "Reklamsız", body: "Hiçbir ekranda reklam görmezsin." },
      {
        title: "Partner bağlama",
        body: "Partnerin döngünü kendi telefonundan takip eder; neyin paylaşılacağına sen karar verirsin. Çiftten biri Premium ise ikisine de açıktır. (Yakında)",
      },
      { title: "Ek temalar", body: "Aurora ve yeni gelecek temalar." },
      { title: "Gelişmiş hatırlatmalar", body: "Bildirim saatini seç, günlük hap hatırlatması kur." },
    ],
    monthly: "Aylık",
    yearly: "Yıllık",
    bestValue: "En avantajlı",
    priceFromStore: "Fiyat Google Play'de görünür",
    trial: "İlk 7 gün ücretsiz. Deneme bitmeden iptal edersen ücret alınmaz.",
    subscribe: "7 gün ücretsiz dene",
    comingSoon: "Satın alma, uygulama Google Play'de yayınlandığında açılacak.",
    restore: "Satın alımları geri yükle",
    terms:
      "Abonelik, iptal edilene kadar seçtiğin dönemin sonunda otomatik yenilenir. Google Play > Abonelikler'den istediğin zaman iptal edebilirsin.",
    active: "Premium aktif. Bütün özellikler açık.",
  },
};

/** Bütün dillerin uyması gereken yapı. */
export type Messages = typeof tr;
