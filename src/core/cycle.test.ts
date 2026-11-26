import { describe, expect, it } from "vitest";
import { computePredictionAccuracy } from "./accuracy";
import { buildDayMarkers } from "./calendar";
import { addDays } from "./date";
import {
  buildCycleOverview,
  getCycleDay,
  getCycleStartingOn,
  getDaysUntilFertileWindow,
  getFertileWindowDays,
  getFertilityLevel,
  getPeriodCycleForDate,
  getPhaseForCycleDay,
  getPhaseForDate,
  getPhaseRanges,
  isPeriodDay,
  predictUpcomingPeriods,
} from "./predict";
import { computeCycleStats, getCycleLengths, getPeriodLengths } from "./stats";
import type { Cycle } from "./types";

/** 5 gün süren regl ile başlayan bir döngü kaydı üretir. */
function cycle(id: string, startDate: string, periodDays = 5): Cycle {
  return { id, startDate, periodEndDate: addDays(startDate, periodDays - 1) };
}

/** Tam 28 günde bir tekrar eden düzenli bir geçmiş. */
const REGULAR_CYCLES: Cycle[] = [
  cycle("1", "2026-04-05"),
  cycle("2", "2026-05-03"),
  cycle("3", "2026-05-31"),
  cycle("4", "2026-06-28"),
];

describe("döngü uzunlukları", () => {
  it("ardışık başlangıçlar arasındaki farkı ölçer", () => {
    expect(getCycleLengths(REGULAR_CYCLES)).toEqual([28, 28, 28]);
  });

  it("son döngüyü saymaz çünkü uzunluğu henüz bilinmez", () => {
    expect(getCycleLengths(REGULAR_CYCLES)).toHaveLength(REGULAR_CYCLES.length - 1);
  });

  it("sıralanmamış girdiyi kendisi sıralar", () => {
    const shuffled = [REGULAR_CYCLES[2]!, REGULAR_CYCLES[0]!, REGULAR_CYCLES[3]!, REGULAR_CYCLES[1]!];
    expect(getCycleLengths(shuffled)).toEqual([28, 28, 28]);
  });

  it("akıl dışı uzunlukları eler", () => {
    // Kullanıcının yanlış yıl seçmesi gibi hatalar ortalamayı bozmamalı.
    const withTypo = [...REGULAR_CYCLES, cycle("5", "2027-06-28")];
    expect(getCycleLengths(withTypo)).toEqual([28, 28, 28]);
  });

  it("regl sürelerini iki uç dahil hesaplar", () => {
    expect(getPeriodLengths(REGULAR_CYCLES)).toEqual([5, 5, 5, 5]);
  });

  it("bitişi işaretlenmemiş döngüyü regl süresi hesabına katmaz", () => {
    const ongoing: Cycle = { id: "6", startDate: "2026-07-26", periodEndDate: null };
    expect(getPeriodLengths([...REGULAR_CYCLES, ongoing])).toHaveLength(4);
  });
});

describe("istatistikler", () => {
  it("düzenli döngüyü düzenli olarak işaretler", () => {
    const stats = computeCycleStats(REGULAR_CYCLES);
    expect(stats.averageCycleLength).toBe(28);
    expect(stats.medianCycleLength).toBe(28);
    expect(stats.cycleLengthVariation).toBe(0);
    expect(stats.isRegular).toBe(true);
    expect(stats.usingDefaults).toBe(false);
    expect(stats.observedCycleCount).toBe(3);
  });

  it("veri yokken varsayılanlara düşer ve bunu bildirir", () => {
    const stats = computeCycleStats([]);
    expect(stats.usingDefaults).toBe(true);
    expect(stats.averageCycleLength).toBe(28);
    expect(stats.averagePeriodLength).toBe(5);
    expect(stats.observedCycleCount).toBe(0);
  });

  it("tek döngüden uzunluk çıkarımı yapmaz", () => {
    const stats = computeCycleStats([cycle("1", "2026-06-28")]);
    expect(stats.usingDefaults).toBe(true);
    // Regl süresi tek kayıttan da bilinebilir, döngü uzunluğu bilinemez.
    expect(stats.averagePeriodLength).toBe(5);
  });

  it("düzensiz döngüyü düzensiz olarak işaretler", () => {
    const irregular: Cycle[] = [
      cycle("1", "2026-01-01"),
      cycle("2", "2026-02-01"), // 31
      cycle("3", "2026-02-22"), // 21
      cycle("4", "2026-04-05"), // 42
    ];
    const stats = computeCycleStats(irregular);
    expect(stats.isRegular).toBe(false);
    expect(stats.shortestCycleLength).toBe(21);
    expect(stats.longestCycleLength).toBe(42);
  });
});

describe("tahmin", () => {
  const stats = computeCycleStats(REGULAR_CYCLES);

  it("sonraki adeti son döngüden 28 gün sonrasına koyar", () => {
    const [next] = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-07-10");
    expect(next?.startDate).toBe("2026-07-26");
    expect(next?.endDate).toBe("2026-07-30");
  });

  it("yumurtlamayı sonraki adetten 14 gün geriye koyar", () => {
    const [next] = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-07-10");
    expect(next?.ovulationDate).toBe("2026-07-12");
    expect(next?.fertileWindowStart).toBe("2026-07-07");
    expect(next?.fertileWindowEnd).toBe("2026-07-13");
  });

  it("istenen sayıda ileri tahmin üretir", () => {
    const upcoming = predictUpcomingPeriods(REGULAR_CYCLES, stats, 3, "2026-07-10");
    expect(upcoming.map((p) => p.startDate)).toEqual([
      "2026-07-26",
      "2026-08-23",
      "2026-09-20",
    ]);
  });

  it("düzenli ve yeterli veride yüksek güven verir", () => {
    const [next] = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-07-10");
    expect(next?.confidence).toBe("high");
  });

  it("veri azken güveni düşük tutar", () => {
    const single = [cycle("1", "2026-06-28")];
    const singleStats = computeCycleStats(single);
    const [next] = predictUpcomingPeriods(single, singleStats, 1, "2026-07-10");
    expect(next?.confidence).toBe("low");
  });

  it("hiç kayıt yoksa tahmin üretmez", () => {
    expect(predictUpcomingPeriods([], computeCycleStats([]), 3, "2026-07-10")).toEqual([]);
  });

  it("süresi geçmiş tahminleri atlar", () => {
    const [next] = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-09-01");
    expect(next?.startDate).toBe("2026-09-20");
  });

  it("gecikmiş ama süresi dolmamış tahmini elde tutar", () => {
    // 26 Temmuz beklenirken 29 Temmuz olmuş: gecikme gösterilebilmeli.
    const [next] = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-07-29");
    expect(next?.startDate).toBe("2026-07-26");
  });
});

describe("faz belirleme", () => {
  const stats = computeCycleStats(REGULAR_CYCLES);

  it("regl günlerini adet fazı sayar", () => {
    expect(getPhaseForDate("2026-07-01", REGULAR_CYCLES, stats)).toBe("menstrual");
  });

  it("regl sonrasını foliküler faz sayar", () => {
    expect(getPhaseForDate("2026-07-05", REGULAR_CYCLES, stats)).toBe("follicular");
  });

  it("yumurtlama gününü işaretler", () => {
    // Döngü 2026-06-28'de başlıyor; 28 günlük döngüde yumurtlama 15. gün,
    // yani 2026-07-12. Bir gün öncesi de bu faza dahil.
    expect(getPhaseForDate("2026-07-12", REGULAR_CYCLES, stats)).toBe("ovulation");
    expect(getPhaseForDate("2026-07-11", REGULAR_CYCLES, stats)).toBe("ovulation");
  });

  it("yumurtlama günü, tahmin edilen yumurtlama tarihiyle aynı gündür", () => {
    // İki ayrı yol aynı sonucu vermeli: tahmin sonraki adetten geriye sayar,
    // faz hesabı döngü başından ileri. Aralarında bir gün kayma vardı.
    const [next] = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-07-10");
    expect(getPhaseForDate(next!.ovulationDate, REGULAR_CYCLES, stats)).toBe("ovulation");

    const ranges = getPhaseRanges(stats);
    const ovulation = ranges.find((range) => range.phase === "ovulation")!;
    const cycleDay = getCycleDay(next!.ovulationDate, REGULAR_CYCLES)!;

    // Tahmin edilen gün bandın ortasında olmalı, kenarında değil.
    expect(cycleDay).toBe(ovulation.startDay + 1);
    expect(cycleDay).toBe(ovulation.endDay - 1);
  });

  it("yumurtlama sonrasını luteal faz sayar", () => {
    expect(getPhaseForDate("2026-07-20", REGULAR_CYCLES, stats)).toBe("luteal");
  });

  it("ilk kayıttan önceki tarihe faz atamaz", () => {
    expect(getPhaseForDate("2026-01-01", REGULAR_CYCLES, stats)).toBeNull();
  });
});

describe("regl günü tespiti", () => {
  it("işaretlenmiş aralığı regl günü sayar", () => {
    expect(isPeriodDay("2026-06-30", REGULAR_CYCLES, "2026-07-10")).toBe(true);
    expect(isPeriodDay("2026-07-02", REGULAR_CYCLES, "2026-07-10")).toBe(true);
    expect(isPeriodDay("2026-07-03", REGULAR_CYCLES, "2026-07-10")).toBe(false);
  });

  it("bitişi işaretlenmemiş regli bugüne kadar sürdürür", () => {
    const ongoing: Cycle[] = [{ id: "1", startDate: "2026-07-08", periodEndDate: null }];
    expect(isPeriodDay("2026-07-09", ongoing, "2026-07-10")).toBe(true);
    expect(isPeriodDay("2026-07-11", ongoing, "2026-07-10")).toBe(false);
  });

  it("bitişi işaretlemeyi unutan kullanıcıda sonsuza kadar sürmez", () => {
    const forgotten: Cycle[] = [{ id: "1", startDate: "2026-01-01", periodEndDate: null }];
    expect(isPeriodDay("2026-06-01", forgotten, "2026-07-10")).toBe(false);
  });
});

describe("faz aralıkları", () => {
  const stats = computeCycleStats(REGULAR_CYCLES); // 28 günlük döngü, 5 günlük regl

  it("dört fazı da sırayla döndürür", () => {
    const ranges = getPhaseRanges(stats);
    expect(ranges.map((range) => range.phase)).toEqual([
      "menstrual",
      "follicular",
      "ovulation",
      "luteal",
    ]);
  });

  it("28 günlük döngüde beklenen aralıkları verir", () => {
    const ranges = getPhaseRanges(stats);
    const byPhase = Object.fromEntries(ranges.map((range) => [range.phase, range]));

    expect(byPhase.menstrual).toMatchObject({ startDay: 1, endDay: 5 });
    expect(byPhase.follicular).toMatchObject({ startDay: 6, endDay: 13 });
    // Yumurtlama 15. gün; bir gün öncesi ve sonrası da bu faza dahil.
    expect(byPhase.ovulation).toMatchObject({ startDay: 14, endDay: 16 });
    expect(byPhase.luteal).toMatchObject({ startDay: 17, endDay: 28 });
  });

  it("aralıklar tüm döngüyü boşluksuz kaplar", () => {
    const ranges = getPhaseRanges(stats).filter((range) => range.dayCount > 0);
    const total = ranges.reduce((sum, range) => sum + range.dayCount, 0);
    expect(total).toBe(28);

    for (let index = 1; index < ranges.length; index++) {
      expect(ranges[index]!.startDay).toBe(ranges[index - 1]!.endDay + 1);
    }
  });

  it("aralıklar tek günün faz hesabıyla çelişmez", () => {
    // Bu test iki ayrı yolun (aralık listesi ve günlük hesap) aynı sonucu
    // vermesini garanti eder; biri değişirse diğeri de değişmek zorunda kalır.
    const ranges = getPhaseRanges(stats);

    for (let day = 1; day <= 28; day++) {
      const fromRange = ranges.find(
        (range) => range.dayCount > 0 && day >= range.startDay && day <= range.endDay,
      );
      expect(fromRange?.phase).toBe(getPhaseForCycleDay(day, 28, 5));
    }
  });

  it("uzun döngüde luteal faz sabit kalır, foliküler uzar", () => {
    const longCycles: Cycle[] = [
      cycle("1", "2026-01-01"),
      cycle("2", "2026-02-05"), // 35
      cycle("3", "2026-03-12"), // 35
    ];
    const ranges = getPhaseRanges(computeCycleStats(longCycles));
    const byPhase = Object.fromEntries(ranges.map((range) => [range.phase, range]));

    // Yumurtlama 35 - 14 + 1 = 22. güne kayar.
    expect(byPhase.ovulation).toMatchObject({ startDay: 21, endDay: 23 });
    expect(byPhase.luteal?.dayCount).toBe(12);
    expect(byPhase.follicular?.dayCount).toBeGreaterThan(7);
  });
});

describe("doğurganlık seviyesi", () => {
  const stats = computeCycleStats(REGULAR_CYCLES);
  // Yumurtlama 2026-07-12, doğurgan pencere 07-07 – 07-13.
  const prediction = predictUpcomingPeriods(REGULAR_CYCLES, stats, 1, "2026-07-10")[0]!;

  it("yumurtlama günü ve öncesini en yüksek sayar", () => {
    expect(getFertilityLevel("2026-07-12", prediction)).toBe("peak");
    expect(getFertilityLevel("2026-07-11", prediction)).toBe("peak");
  });

  it("yumurtlamadan 2-3 gün öncesini yüksek sayar", () => {
    expect(getFertilityLevel("2026-07-10", prediction)).toBe("high");
    expect(getFertilityLevel("2026-07-09", prediction)).toBe("high");
  });

  it("pencerenin başını orta sayar", () => {
    expect(getFertilityLevel("2026-07-08", prediction)).toBe("medium");
    expect(getFertilityLevel("2026-07-07", prediction)).toBe("medium");
  });

  it("yumurtlamadan sonra hızla düşürür", () => {
    // Yumurtlanan hücre yaklaşık bir gün yaşar.
    expect(getFertilityLevel("2026-07-13", prediction)).toBe("low");
    expect(getFertilityLevel("2026-07-14", prediction)).toBe("none");
  });

  it("pencere dışını çok düşük sayar", () => {
    expect(getFertilityLevel("2026-07-01", prediction)).toBe("none");
    expect(getFertilityLevel("2026-07-20", prediction)).toBe("none");
  });

  it("pencere günlerini seviyeleriyle listeler", () => {
    const days = getFertileWindowDays(prediction);

    expect(days).toHaveLength(7); // 5 gün önce + yumurtlama + 1 gün sonra
    expect(days[0]?.date).toBe("2026-07-07");
    expect(days[6]?.date).toBe("2026-07-13");

    const ovulationDay = days.find((day) => day.isOvulation);
    expect(ovulationDay?.date).toBe("2026-07-12");
    expect(ovulationDay?.level).toBe("peak");
    expect(ovulationDay?.offsetFromOvulation).toBe(0);
  });

  it("doğurgan pencereye kalan günü hesaplar", () => {
    expect(getDaysUntilFertileWindow("2026-07-01", prediction)).toBe(6);
    // Pencerenin içindeyken sıfır döner.
    expect(getDaysUntilFertileWindow("2026-07-10", prediction)).toBe(0);
    expect(getDaysUntilFertileWindow("2026-07-07", prediction)).toBe(0);
    expect(getDaysUntilFertileWindow("2026-07-13", prediction)).toBe(0);
    // Geçtiyse negatif.
    expect(getDaysUntilFertileWindow("2026-07-16", prediction)).toBe(-3);
  });
});

describe("bir güne ait dönem kaydı", () => {
  it("regl gününün ait olduğu döngüyü bulur", () => {
    const cycle = getPeriodCycleForDate("2026-07-01", REGULAR_CYCLES, "2026-07-10");
    expect(cycle?.startDate).toBe("2026-06-28");
  });

  it("regl dışındaki gün için null döner", () => {
    expect(getPeriodCycleForDate("2026-07-10", REGULAR_CYCLES, "2026-07-10")).toBeNull();
  });

  it("o günde başlayan döngüyü ayrıca bulur", () => {
    expect(getCycleStartingOn("2026-06-28", REGULAR_CYCLES)?.id).toBe("4");
    expect(getCycleStartingOn("2026-06-29", REGULAR_CYCLES)).toBeNull();
  });

  it("bitişi işaretlenmemiş dönemde bugüne kadarki günleri kapsar", () => {
    const ongoing: Cycle[] = [{ id: "x", startDate: "2026-07-08", periodEndDate: null }];
    expect(getPeriodCycleForDate("2026-07-09", ongoing, "2026-07-10")?.id).toBe("x");
    expect(getPeriodCycleForDate("2026-07-11", ongoing, "2026-07-10")).toBeNull();
  });
});

describe("ana ekran özeti", () => {
  it("döngü gününü ve sonraki adeti birlikte verir", () => {
    const overview = buildCycleOverview(REGULAR_CYCLES, "2026-07-10");
    expect(overview.currentCycleStart).toBe("2026-06-28");
    expect(overview.cycleDay).toBe(13);
    expect(overview.daysUntilNextPeriod).toBe(16);
    expect(overview.isOnPeriod).toBe(false);
    expect(overview.isFertileToday).toBe(true);
  });

  it("gecikmeyi negatif gün sayısıyla bildirir", () => {
    const overview = buildCycleOverview(REGULAR_CYCLES, "2026-07-29");
    expect(overview.daysUntilNextPeriod).toBe(-3);
  });

  it("regl sürerken bunu bildirir", () => {
    const overview = buildCycleOverview(REGULAR_CYCLES, "2026-06-30");
    expect(overview.isOnPeriod).toBe(true);
    expect(overview.cycleDay).toBe(3);
    expect(overview.phase).toBe("menstrual");
  });

  it("hiç kayıt yokken çökmeden boş özet döner", () => {
    const overview = buildCycleOverview([], "2026-07-10");
    expect(overview.currentCycleStart).toBeNull();
    expect(overview.cycleDay).toBeNull();
    expect(overview.phase).toBeNull();
    expect(overview.nextPeriod).toBeNull();
    expect(overview.stats.usingDefaults).toBe(true);
  });
});

describe("takvim işaretleri", () => {
  it("gerçek regl günü ile tahmini ayırır", () => {
    const markers = buildDayMarkers(["2026-06-30", "2026-07-26"], {
      cycles: REGULAR_CYCLES,
      today: "2026-07-10",
    });

    expect(markers.get("2026-06-30")?.inPeriod).toBe(true);
    expect(markers.get("2026-06-30")?.predictedPeriod).toBe(false);

    expect(markers.get("2026-07-26")?.inPeriod).toBe(false);
    expect(markers.get("2026-07-26")?.predictedPeriod).toBe(true);
  });

  it("doğurgan pencereyi ve yumurtlama gününü işaretler", () => {
    const markers = buildDayMarkers(["2026-07-08", "2026-07-12", "2026-07-20"], {
      cycles: REGULAR_CYCLES,
      today: "2026-07-10",
    });

    expect(markers.get("2026-07-08")?.fertile).toBe(true);
    expect(markers.get("2026-07-12")?.isOvulation).toBe(true);
    expect(markers.get("2026-07-20")?.fertile).toBe(false);
  });

  it("kısa döngüde regl gününü doğurgan olarak da işaretler", () => {
    // 23 günlük döngüde yumurtlama 10. güne düşer, doğurgan pencere 5. günde
    // başlar. 5 günlük kanamayla çakışan bu gün gizlenirse, "regl sırasında
    // gebelik olmaz" yanlış bilgisi tam da bu grupta doğrulanmış görünür.
    const shortCycles: Cycle[] = [
      cycle("1", "2026-01-01"),
      cycle("2", "2026-01-24"), // 23
      cycle("3", "2026-02-16"), // 23
      cycle("4", "2026-03-11"), // 23
    ];

    const overlap = "2026-03-15"; // döngünün 5. günü: hem kanama hem pencere
    const markers = buildDayMarkers([overlap], {
      cycles: shortCycles,
      today: "2026-03-12",
    });

    expect(markers.get(overlap)?.inPeriod).toBe(true);
    expect(markers.get(overlap)?.fertile).toBe(true);
  });

  it("uzun döngüde regl ve doğurgan pencere çakışmaz", () => {
    // Aynı kural uzun döngüde kendiliğinden zaten sağlanır; bu test, yukarıdaki
    // değişikliğin her günü doğurgan göstermeye başlamadığını doğrular.
    const markers = buildDayMarkers(["2026-06-29"], {
      cycles: REGULAR_CYCLES,
      today: "2026-07-10",
    });

    expect(markers.get("2026-06-29")?.inPeriod).toBe(true);
    expect(markers.get("2026-06-29")?.fertile).toBe(false);
  });

  it("günlük kaydı olan günleri işaretler", () => {
    const markers = buildDayMarkers(["2026-07-09", "2026-07-10"], {
      cycles: REGULAR_CYCLES,
      today: "2026-07-10",
      loggedDates: ["2026-07-09"],
    });

    expect(markers.get("2026-07-09")?.hasLog).toBe(true);
    expect(markers.get("2026-07-10")?.hasLog).toBe(false);
    expect(markers.get("2026-07-10")?.isToday).toBe(true);
  });
});

describe("tahmin isabeti", () => {
  /** Tahmini kaydedilmiş bir döngü üretir. */
  function measured(id: string, startDate: string, predictedStartDate: string | null): Cycle {
    return { id, startDate, periodEndDate: null, predictedStartDate };
  }

  it("kaydı olmayan döngüleri ölçüme katmaz", () => {
    const accuracy = computePredictionAccuracy([
      measured("1", "2026-01-01", null),
      measured("2", "2026-01-29", null),
    ]);

    expect(accuracy.sampleCount).toBe(0);
    expect(accuracy.meanAbsoluteError).toBeNull();
    expect(accuracy.bias).toBeNull();
  });

  it("gecikmeyi artı, erken tahmini eksi işaretler", () => {
    const accuracy = computePredictionAccuracy([
      // Tahmin 1 Ocak'tı, adet 3 Ocak'ta geldi: iki gün geç kaldık.
      measured("1", "2026-01-03", "2026-01-01"),
      // Tahmin 5 Şubat'tı, adet 3 Şubat'ta geldi: iki gün erken tahmin ettik.
      measured("2", "2026-02-03", "2026-02-05"),
    ]);

    expect(accuracy.samples.map((sample) => sample.error).sort()).toEqual([-2, 2]);
  });

  it("rastgele hatayla sistematik kaymayı ayırır", () => {
    const rastgele = computePredictionAccuracy([
      measured("1", "2026-01-04", "2026-01-01"), // +3
      measured("2", "2026-02-01", "2026-02-04"), // -3
    ]);

    const kayma = computePredictionAccuracy([
      measured("1", "2026-01-04", "2026-01-01"), // +3
      measured("2", "2026-02-04", "2026-02-01"), // +3
    ]);

    // İkisinde de ortalama mutlak sapma aynı; ayıran şey kayma.
    expect(rastgele.meanAbsoluteError).toBe(3);
    expect(kayma.meanAbsoluteError).toBe(3);

    expect(rastgele.bias).toBe(0);
    expect(kayma.bias).toBe(3);
  });

  it("en yeni ölçümü başa koyar", () => {
    const accuracy = computePredictionAccuracy([
      measured("1", "2026-01-03", "2026-01-01"),
      measured("2", "2026-02-03", "2026-02-05"),
    ]);

    expect(accuracy.samples[0]?.actual).toBe("2026-02-03");
  });
});
