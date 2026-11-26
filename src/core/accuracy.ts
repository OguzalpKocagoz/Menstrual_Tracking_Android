import { daysBetween } from "./date";
import { sortCycles } from "./stats";
import type { Cycle } from "./types";

/**
 * Tahmin isabetinin ölçümü.
 *
 * Yalnızca kaydedilmiş tahminlere bakar (`predictedStartDate`); geçmişe dönük
 * girilen döngüler ölçüme girmez, çünkü onlar için kullanıcıya bir tahmin
 * gösterilmemişti.
 *
 * Bu ölçüm kullanıcıya gösterilmez. "Tahminlerimiz iki gün şaşıyor" bilgisi
 * kullanıcının işine yaramaz, yalnızca güvenini azaltır; asıl faydası
 * algoritmayı değiştirdiğimizde gerçekten iyileştirip iyileştirmediğimizi
 * anlayabilmek.
 */

export interface PredictionSample {
  /** Gerçekleşen başlangıç. */
  actual: ISODateLike;
  /** O gün gösterilen tahmin. */
  predicted: ISODateLike;
  /**
   * Gün farkı: artı değer geç kaldığımızı (adet tahminden sonra geldi), eksi
   * değer erken tahmin ettiğimizi gösterir.
   */
  error: number;
}

type ISODateLike = string;

export interface PredictionAccuracy {
  /** Ölçülebilen tahmin sayısı. */
  sampleCount: number;
  /**
   * Ortalama mutlak sapma (gün).
   *
   * "Ne kadar şaşıyoruz" sorusunun cevabı. İşaretler yok sayılır, çünkü iki
   * gün erken ile iki gün geç aynı ölçüde yanlıştır.
   */
  meanAbsoluteError: number | null;
  /**
   * Ortalama işaretli sapma (gün).
   *
   * Sistematik yanlılığı gösterir ve mutlak sapmadan ayrı tutulması şart:
   * `[+3, -3, +3, -3]` dizisinde mutlak sapma 3'tür ama yanlılık sıfırdır —
   * rastgele hata vardır, kayma yoktur. `[+3, +3, +3]` dizisinde ikisi de
   * 3'tür; bu düzeltilebilir bir kaymadır.
   */
  bias: number | null;
  /** En yeni ölçümler, yeniden eskiye. */
  samples: PredictionSample[];
}

/** Kaydedilmiş tahminleri gerçekleşen tarihlerle karşılaştırır. */
export function computePredictionAccuracy(cycles: readonly Cycle[]): PredictionAccuracy {
  const samples: PredictionSample[] = [];

  for (const cycle of sortCycles(cycles)) {
    const predicted = cycle.predictedStartDate;
    if (!predicted) continue;

    samples.push({
      actual: cycle.startDate,
      predicted,
      error: daysBetween(predicted, cycle.startDate),
    });
  }

  if (samples.length === 0) {
    return { sampleCount: 0, meanAbsoluteError: null, bias: null, samples: [] };
  }

  const total = samples.reduce((sum, sample) => sum + sample.error, 0);
  const absolute = samples.reduce((sum, sample) => sum + Math.abs(sample.error), 0);

  return {
    sampleCount: samples.length,
    meanAbsoluteError: Math.round((absolute / samples.length) * 10) / 10,
    bias: Math.round((total / samples.length) * 10) / 10,
    samples: samples.reverse(),
  };
}
