import { describe, expect, it } from "vitest";
import type { Cycle } from "@/core";
import {
  assertPeriodRange,
  assertStartDate,
  capturePrediction,
  errorMessage,
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
    expect(() => assertStartDate("2026-11-27", "2026-11-26")).toThrow(/Gelecek/);
    expect(() => assertStartDate("2026-11-26", "2026-11-26")).not.toThrow();
  });

  it("bitiş başlangıçtan önce olamaz ve kanama 12 günü geçemez", () => {
    expect(() => assertPeriodRange("2026-11-10", "2026-11-09")).toThrow(/önce/);
    expect(() => assertPeriodRange("2026-11-10", "2026-11-21")).not.toThrow();
    expect(() => assertPeriodRange("2026-11-10", "2026-11-22")).toThrow(/12/);
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
    expect(() => sanitizeLog({ ...EMPTY, temperatureC: 50 })).toThrow(/34-43/);
  });

  it("boş kayıt boş sayılır", () => {
    expect(isEmptyLog(sanitizeLog({ ...EMPTY, notes: "   " }))).toBe(true);
    expect(isEmptyLog({ ...EMPTY, mood: "great" })).toBe(false);
  });
});

describe("parseLength ve errorMessage", () => {
  it("boş değer null, aralık dışı kullanıcı hatası", () => {
    expect(parseLength("", 15, 60, "Döngü uzunluğu")).toBeNull();
    expect(parseLength("28", 15, 60, "Döngü uzunluğu")).toBe(28);
    expect(() => parseLength("70", 15, 60, "Döngü uzunluğu")).toThrow(/15–60/);
  });

  it("yalnızca kullanıcı hatalarının metnini gösterir", () => {
    let caught: unknown;
    try {
      parseLength("abc", 1, 12, "Regl süresi");
    } catch (error) {
      caught = error;
    }
    expect(errorMessage(caught)).toMatch(/Regl süresi/);
    expect(errorMessage(new Error("SQLITE_IOERR /data/data/..."), "Genel")).toBe("Genel");
  });
});
