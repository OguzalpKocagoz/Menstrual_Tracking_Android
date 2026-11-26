import { describe, expect, it } from "vitest";
import type { Cycle } from "@/core";
import {
  assertPeriodRange,
  assertStartDate,
  capturePrediction,
  isEmptyLog,
  parseLength,
  sanitizeLog,
} from "./rules";

function cycle(startDate: string): Cycle {
  return { id: startDate, startDate, periodEndDate: null, notes: null, predictedStartDate: null };
}

const EMPTY = { flow: null, mood: null, symptoms: [], notes: null, temperatureC: null };

describe("capturePrediction", () => {
  const history = [cycle("2026-07-01"), cycle("2026-07-29"), cycle("2026-08-26")];

  it("kayıt anında gösterilen tahmini yalnızca önceki döngülerden bulur", () => {
    // 28 günlük düzenli geçmiş → sıradaki tahmin 2026-09-23.
    expect(capturePrediction(history, "2026-09-24", "2026-09-24")).toBe("2026-09-23");
  });

  it("sonraki döngüleri hesaba katmaz", () => {
    const withLater = [...history, cycle("2026-10-30")];
    expect(capturePrediction(withLater, "2026-09-24", "2026-09-24")).toBe("2026-09-23");
  });

  it("geçmiş yoksa ya da kayıt geriye dönük toplu girişse tahmin yazmaz", () => {
    expect(capturePrediction([], "2026-09-24", "2026-09-24")).toBeNull();
    expect(capturePrediction(history, "2026-09-24", "2026-11-26")).toBeNull();
  });
});

describe("tarih kuralları", () => {
  it("gelecek tarihe başlangıç girilemez", () => {
    expect(() => assertStartDate("2026-11-27", "2026-11-26")).toThrow(/futureStart/);
    expect(() => assertStartDate("2026-11-26", "2026-11-26")).not.toThrow();
  });

  it("bitiş başlangıçtan önce olamaz ve kanama 12 günü geçemez", () => {
    expect(() => assertPeriodRange("2026-11-10", "2026-11-09")).toThrow(/endBeforeStart/);
    expect(() => assertPeriodRange("2026-11-10", "2026-11-21")).not.toThrow();
    expect(() => assertPeriodRange("2026-11-10", "2026-11-22")).toThrow(/periodTooLong/);
    expect(() => assertPeriodRange("2026-11-10", null)).not.toThrow();
  });
});

describe("günlük kaydı", () => {
  it("notu kırpar, tekrar eden ve bilinmeyen belirtileri atar", () => {
    const log = sanitizeLog({
      ...EMPTY,
      notes: "  merhaba  ",
      symptoms: ["cramps", "cramps", "uydurma" as never],
    });
    expect(log.notes).toBe("merhaba");
    expect(log.symptoms).toEqual(["cramps"]);
  });

  it("geçersiz sıcaklığı reddeder", () => {
    expect(() => sanitizeLog({ ...EMPTY, temperatureC: 50 })).toThrow(/temperatureRange/);
  });

  it("boş kayıt boş sayılır", () => {
    expect(isEmptyLog(sanitizeLog({ ...EMPTY, notes: "   " }))).toBe(true);
    expect(isEmptyLog({ ...EMPTY, mood: "great" })).toBe(false);
  });
});

describe("parseLength", () => {
  it("boş değer null, aralık dışı kullanıcı hatası", () => {
    expect(parseLength("", 15, 60, "cycleLength")).toBeNull();
    expect(parseLength("28", 15, 60, "cycleLength")).toBe(28);
    expect(() => parseLength("70", 15, 60, "cycleLength")).toThrow(/lengthRange/);
  });

  it("hata, metni dile göre üretilebilsin diye alanı ve sınırları taşır", () => {
    let caught: unknown;
    try {
      parseLength("abc", 1, 12, "periodLength");
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({ code: "lengthRange", params: { field: "periodLength", min: 1, max: 12 } });
  });
});
