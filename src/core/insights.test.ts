import { describe, expect, it } from "vitest";
import { addDays } from "./date";
import { getCycleInsights, getPredictionWindow } from "./insights";
import { buildCycleOverview, computeCycleStats } from "./index";
import type { Cycle } from "./types";

/** Verilen döngü uzunluklarından kayıt üretir; kanama süresi isteğe bağlı. */
function history(lengths: number[], periodDays: number | null = 5, start = "2026-01-01"): Cycle[] {
  const cycles: Cycle[] = [];
  let date = start;
  for (let index = 0; index <= lengths.length; index++) {
    cycles.push({
      id: String(index),
      startDate: date,
      periodEndDate: periodDays === null ? null : addDays(date, periodDays - 1),
      notes: null,
      predictedStartDate: null,
    });
    date = addDays(date, lengths[index] ?? 0);
  }
  return cycles;
}

function lastStart(cycles: Cycle[]): string {
  return cycles[cycles.length - 1]!.startDate;
}

describe("getPredictionWindow", () => {
  it("veri yokken geniş, sabit bir aralık verir", () => {
    const cycles = history([]);
    const overview = buildCycleOverview(cycles, "2026-01-05");
    const window = getPredictionWindow(overview.nextPeriod!, overview.stats);
    expect(window.spreadDays).toBe(4);
    expect(window.highlyVariable).toBe(false);
  });

  it("düzenli döngüde dar, en az 1 gün", () => {
    const cycles = history([28, 28, 28, 28]);
    const overview = buildCycleOverview(cycles, lastStart(cycles));
    const window = getPredictionWindow(overview.nextPeriod!, overview.stats);
    expect(window.spreadDays).toBe(1);
    expect(window.earliest).toBe(addDays(window.likely, -1));
    expect(window.latest).toBe(addDays(window.likely, 1));
  });

  it("değişken döngüde aralık genişler ve uyarı işareti konur", () => {
    const cycles = history([24, 36, 26, 38]);
    const overview = buildCycleOverview(cycles, lastStart(cycles));
    const window = getPredictionWindow(overview.nextPeriod!, overview.stats);
    expect(window.spreadDays).toBeGreaterThanOrEqual(6);
    expect(window.highlyVariable).toBe(true);
  });

  it("aralık 10 günü geçmez", () => {
    const stats = { ...computeCycleStats(history([28, 28])), cycleLengthVariation: 25 };
    const overview = buildCycleOverview(history([28, 28]), "2026-02-01");
    expect(getPredictionWindow(overview.nextPeriod!, stats).spreadDays).toBe(10);
  });
});

describe("getCycleInsights", () => {
  it("düzenli ve normal döngüde gözlem yok", () => {
    const cycles = history([28, 29, 27, 28, 30]);
    expect(getCycleInsights(cycles, lastStart(cycles))).toEqual([]);
  });

  it("3 döngüden az veride kalıp gözlemi yapmaz", () => {
    const cycles = history([20, 45]);
    expect(getCycleInsights(cycles, lastStart(cycles))).toEqual([]);
  });

  it("en kısa ile en uzun arası 10+ gün ise düzensiz der; 9 günde demez", () => {
    const irregular = history([25, 35, 28]);
    expect(getCycleInsights(irregular, lastStart(irregular))).toContainEqual({
      kind: "irregular",
      shortest: 25,
      longest: 35,
      cycleCount: 3,
    });
    const borderline = history([25, 34, 28]);
    expect(getCycleInsights(borderline, lastStart(borderline)).map((i) => i.kind)).not.toContain("irregular");
  });

  it("sık ve seyrek döngü için en az iki sınır dışı döngü arar", () => {
    const once = history([22, 28, 28, 28]);
    expect(getCycleInsights(once, lastStart(once))).toEqual([]);
    const twice = history([22, 23, 28, 28]);
    expect(getCycleInsights(twice, lastStart(twice)).map((i) => i.kind)).toContain("frequent");
    const long = history([40, 42, 39]);
    expect(getCycleInsights(long, lastStart(long)).map((i) => i.kind)).toContain("infrequent");
  });

  it("8 günden uzun kanama en az iki kez olunca gözlem verir", () => {
    const cycles = history([28, 28, 28], 9);
    expect(getCycleInsights(cycles, lastStart(cycles))).toContainEqual({
      kind: "prolongedBleeding",
      count: 4,
      periodCount: 4,
    });
    const eight = history([28, 28, 28], 8);
    expect(getCycleInsights(eight, lastStart(eight))).toEqual([]);
  });

  it("son adetten 90 gün geçtiyse, az veride bile söyler", () => {
    const cycles = history([28]);
    const today = addDays(lastStart(cycles), 90);
    expect(getCycleInsights(cycles, today)).toEqual([{ kind: "noRecentPeriod", days: 90 }]);
    expect(getCycleInsights(cycles, addDays(lastStart(cycles), 89))).toEqual([]);
  });
});
