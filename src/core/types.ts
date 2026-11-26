import type { ISODate } from "./date";

/** Kanama yoğunluğu. Veritabanındaki `flow_intensity` enum'u ile birebir aynıdır. */
export type FlowIntensity = "spotting" | "light" | "medium" | "heavy";

export const FLOW_INTENSITIES: readonly FlowIntensity[] = [
  "spotting",
  "light",
  "medium",
  "heavy",
];

export const FLOW_LABELS_TR: Record<FlowIntensity, string> = {
  spotting: "Lekelenme",
  light: "Az",
  medium: "Orta",
  heavy: "Yoğun",
};

export type Mood = "great" | "good" | "neutral" | "low" | "irritable" | "anxious";

export const MOODS: readonly Mood[] = ["great", "good", "neutral", "low", "irritable", "anxious"];

export const MOOD_LABELS_TR: Record<Mood, string> = {
  great: "Çok iyi",
  good: "İyi",
  neutral: "Normal",
  low: "Düşük",
  irritable: "Sinirli",
  anxious: "Kaygılı",
};

export type Symptom =
  | "cramps"
  | "headache"
  | "bloating"
  | "backache"
  | "tender_breasts"
  | "acne"
  | "fatigue"
  | "nausea"
  | "insomnia"
  | "cravings";

export const SYMPTOMS: readonly Symptom[] = [
  "cramps",
  "headache",
  "bloating",
  "backache",
  "tender_breasts",
  "acne",
  "fatigue",
  "nausea",
  "insomnia",
  "cravings",
];

export const SYMPTOM_LABELS_TR: Record<Symptom, string> = {
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
};

/**
 * Bir adet döngüsü. `startDate` regl kanamasının ilk günüdür ve döngünün de
 * ilk günüdür. `periodEndDate` kanamanın son günü; kanama sürerken null olur.
 */
export interface Cycle {
  id: string;
  startDate: ISODate;
  periodEndDate: ISODate | null;
  notes?: string | null;
  /**
   * Bu döngü başlamadan önce uygulamanın tahmin ettiği başlangıç tarihi.
   *
   * Kayıt anında yazılır ve bir daha değişmez: amacı, kullanıcıya o gün
   * gerçekten gösterilen tahmini saklamaktır. Sonradan hesaplanamaz — geçmiş
   * tarihlerden yeniden tahmin üretmek, bugünkü algoritmanın eski veriyle ne
   * yapacağını ölçer, o gün ekranda ne yazdığını değil.
   *
   * Geçmişe dönük girilen döngülerde null kalır; hiç gösterilmemiş bir tahmini
   * isabet ölçümüne katmak yanıltıcı olurdu.
   */
  predictedStartDate?: ISODate | null;
}

/** Bir güne ait kullanıcı kaydı. Tarih başına en fazla bir tane bulunur. */
export interface DailyLog {
  date: ISODate;
  flow: FlowIntensity | null;
  mood: Mood | null;
  symptoms: Symptom[];
  notes: string | null;
  temperatureC: number | null;
}

/**
 * Arayüz teması. Hesap başına saklanır, böylece aynı uygulamayı kullanan
 * farklı kişiler kendi görünümleriyle karşılaşır. Her tema hem açık hem koyu
 * modda çalışır.
 */
export type AppTheme = "rose" | "bloom" | "ocean" | "forest" | "aurora";

/** Her hesabın seçebileceği klasik temalar. */
export const STANDARD_THEMES: readonly AppTheme[] = ["rose", "bloom", "ocean", "forest"];

/** Yalnızca özel hesaplara açık temalar. */
export const SPECIAL_THEMES: readonly AppTheme[] = ["aurora"];

export const APP_THEMES: readonly AppTheme[] = [...STANDARD_THEMES, ...SPECIAL_THEMES];

export const DEFAULT_THEME: AppTheme = "rose";

/** Özel hesap açıldığında varsayılan olarak atanan tema. */
export const DEFAULT_SPECIAL_THEME: AppTheme = "aurora";

export const THEME_LABELS_TR: Record<AppTheme, string> = {
  rose: "Gül",
  bloom: "Lavanta",
  ocean: "Okyanus",
  forest: "Orman",
  aurora: "Aurora",
};

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === "string" && (APP_THEMES as readonly string[]).includes(value);
}

/**
 * Hesap türü.
 *
 * `special`, ayrı bir giriş yolundan davet koduyla açılan hesaptır: açılış
 * animasyonu görür ve yalnızca kendisine açık temalara erişir.
 */
export type AccountKind = "standard" | "special";

export const DEFAULT_ACCOUNT_KIND: AccountKind = "standard";

export function isAccountKind(value: unknown): value is AccountKind {
  return value === "standard" || value === "special";
}

/** Hesabın seçebileceği temalar. */
export function getAvailableThemes(kind: AccountKind): readonly AppTheme[] {
  return kind === "special" ? APP_THEMES : STANDARD_THEMES;
}

/** Tema, o hesap türüne açık mı. */
export function canUseTheme(kind: AccountKind, theme: AppTheme): boolean {
  return getAvailableThemes(kind).includes(theme);
}

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

/** Döngünün dört fazı, gerçekleşme sırasına göre. */
export const CYCLE_PHASES: readonly CyclePhase[] = [
  "menstrual",
  "follicular",
  "ovulation",
  "luteal",
];

/** Bir fazın döngü içindeki gün aralığı (iki uç dahil, 1 tabanlı). */
export interface PhaseRange {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
  dayCount: number;
}

/**
 * Fazların adları. Tıbbi terim esas alınır çünkü kullanıcı kaynaklarda bu
 * adlarla karşılaşır; gündelik karşılığı `PHASE_ALIAS_TR` ile parantez içinde
 * gösterilir.
 */
export const PHASE_LABELS_TR: Record<CyclePhase, string> = {
  menstrual: "Menstrüasyon",
  follicular: "Foliküler faz",
  ovulation: "Ovülasyon",
  luteal: "Luteal faz",
};

/** Gündelik karşılığı; tıbbi adla aynı olan fazlarda null. */
export const PHASE_ALIAS_TR: Record<CyclePhase, string | null> = {
  menstrual: "Regl dönemi",
  follicular: null,
  ovulation: "Yumurtlama",
  luteal: null,
};

export const PHASE_DESCRIPTIONS_TR: Record<CyclePhase, string> = {
  menstrual: "Kanama sürüyor. Enerjin düşük olabilir, dinlenmeye özen göster.",
  follicular: "Enerjinin genellikle yükseldiği dönem.",
  ovulation: "Yumurtlama zamanı. Gebelik ihtimalinin en yüksek olduğu günler.",
  luteal: "Adet öncesi dönem. Şişkinlik ve ruh hâli değişimleri görülebilir.",
};


export interface CycleStats {
  /** Gözlemlenen döngü uzunluklarının ortalaması (gün). */
  averageCycleLength: number;
  /** Medyan; birkaç aykırı döngüden ortalamaya göre daha az etkilenir. */
  medianCycleLength: number;
  shortestCycleLength: number | null;
  longestCycleLength: number | null;
  /** Standart sapma. Düzenlilik ölçüsü olarak kullanılır. */
  cycleLengthVariation: number;
  averagePeriodLength: number;
  /** Uzunluk hesabına giren döngü sayısı (toplam döngü sayısından bir eksiktir). */
  observedCycleCount: number;
  /** Sapma eşiğin altındaysa döngü düzenli sayılır. */
  isRegular: boolean;
  /** Veri yetersiz olduğu için varsayılan değerler kullanıldıysa true. */
  usingDefaults: boolean;
}

export type PredictionConfidence = "low" | "medium" | "high";

export interface PeriodPrediction {
  startDate: ISODate;
  endDate: ISODate;
  fertileWindowStart: ISODate;
  fertileWindowEnd: ISODate;
  ovulationDate: ISODate;
  confidence: PredictionConfidence;
}

/**
 * Bir günde gebe kalma ihtimalinin göreli seviyesi.
 *
 * Yumurtlanan hücre yaklaşık 24 saat canlı kalırken sperm rahim yolunda
 * 5 güne kadar yaşayabilir. Bu yüzden ihtimal yumurtlamadan ÖNCEKİ günlerde
 * yükselir ve yumurtlamadan sonra hızla düşer.
 */
export type FertilityLevel = "peak" | "high" | "medium" | "low" | "none";

export const FERTILITY_LABELS_TR: Record<FertilityLevel, string> = {
  peak: "En yüksek",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  none: "Çok düşük",
};

export interface FertileDay {
  date: ISODate;
  level: FertilityLevel;
  isOvulation: boolean;
  /** Yumurtlama gününe göre kaç gün (negatif = önce). */
  offsetFromOvulation: number;
}

/** Ana ekranın tek bir çağrıyla ihtiyaç duyduğu her şey. */
export interface CycleOverview {
  today: ISODate;
  /** İçinde bulunulan döngünün ilk günü. Hiç kayıt yoksa null. */
  currentCycleStart: ISODate | null;
  /** Döngünün kaçıncı günü (1 tabanlı). Kayıt yoksa null. */
  cycleDay: number | null;
  phase: CyclePhase | null;
  isOnPeriod: boolean;
  nextPeriod: PeriodPrediction | null;
  /** Negatif değer gecikmeyi gösterir. */
  daysUntilNextPeriod: number | null;
  isFertileToday: boolean;
  stats: CycleStats;
}
