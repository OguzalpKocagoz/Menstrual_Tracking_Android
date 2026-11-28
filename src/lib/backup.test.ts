import { describe, expect, it } from "vitest";
import type { Cycle, DailyLog } from "@/core";
import { backupFileName, BACKUP_FORMAT, createBackup, parseBackup } from "./backup";

const cycles: Cycle[] = [
  { id: "a", startDate: "2026-09-01", periodEndDate: "2026-09-05", notes: null, predictedStartDate: null },
  { id: "b", startDate: "2026-09-29", periodEndDate: null, notes: "not", predictedStartDate: "2026-09-30" },
];
const logs: DailyLog[] = [
  { date: "2026-09-02", flow: "heavy", mood: "low", symptoms: ["cramps"], notes: "x", temperatureC: 36.6 },
];

function file(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({ ...createBackup({ cycles, logs }, new Date("2026-11-27T10:00:00Z")), ...overrides });
}

describe("yedek", () => {
  it("dışa aktarılan dosya aynen geri okunur", () => {
    expect(parseBackup(file())).toEqual({ cycles, logs });
  });

  it("dosya adı tarih taşır", () => {
    expect(backupFileName("2026-11-27")).toBe("dongum-yedek-2026-11-27.json");
  });

  it("başka bir dosyayı ve bozuk JSON'u reddeder", () => {
    expect(() => parseBackup("{bozuk")).toThrow(/invalidBackup/);
    expect(() => parseBackup(JSON.stringify({ hello: 1 }))).toThrow(/invalidBackup/);
    expect(() => parseBackup(file({ format: "baska-uygulama" }))).toThrow(/invalidBackup/);
  });

  it("daha yeni sürümün dosyasını reddeder", () => {
    expect(() => parseBackup(file({ version: 99 }))).toThrow(/invalidBackup/);
  });

  it("tek bir hatalı kayıt bütün dosyayı reddeder", () => {
    const badDate = { ...cycles[0], startDate: "2026-13-40" };
    expect(() => parseBackup(file({ cycles: [badDate] }))).toThrow(/invalidBackup/);
    const reversed = { ...cycles[0], periodEndDate: "2026-08-01" };
    expect(() => parseBackup(file({ cycles: [reversed] }))).toThrow(/invalidBackup/);
    const hotLog = { ...logs[0], temperatureC: 50 };
    expect(() => parseBackup(file({ logs: [hotLog] }))).toThrow(/invalidBackup/);
    const badFlow = { ...logs[0], flow: "sel" };
    expect(() => parseBackup(file({ logs: [badFlow] }))).toThrow(/invalidBackup/);
  });

  it("aynı güne iki döngü ya da iki günlük kabul etmez", () => {
    expect(() => parseBackup(file({ cycles: [cycles[0], { ...cycles[0], id: "c" }] }))).toThrow(/invalidBackup/);
    expect(() => parseBackup(file({ logs: [logs[0], logs[0]] }))).toThrow(/invalidBackup/);
  });

  it("eksik isteğe bağlı alanları boş sayar, bilinmeyen belirtileri atar", () => {
    const minimal = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      cycles: [{ id: "z", startDate: "2026-10-01" }],
      logs: [{ date: "2026-10-02", symptoms: ["cramps", "uydurma"] }],
    });
    expect(parseBackup(minimal)).toEqual({
      cycles: [{ id: "z", startDate: "2026-10-01", periodEndDate: null, notes: null, predictedStartDate: null }],
      logs: [{ date: "2026-10-02", flow: null, mood: null, symptoms: ["cramps"], notes: null, temperatureC: null }],
    });
  });
});
