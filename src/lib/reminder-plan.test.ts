import { describe, expect, it } from "vitest";
import type { Cycle } from "@/core";
import { planReminders } from "./reminder-plan";

function cycle(startDate: string, periodEndDate: string | null = null): Cycle {
  return { id: startDate, startDate, periodEndDate, notes: null, predictedStartDate: null };
}

// 28 günlük düzenli geçmiş: sıradaki başlangıçlar 2026-11-18'den itibaren 28'er gün arayla.
const HISTORY = [
  cycle("2026-08-26", "2026-08-30"),
  cycle("2026-09-23", "2026-09-27"),
  cycle("2026-10-21", "2026-10-25"),
  cycle("2026-11-18", "2026-11-22"),
];

describe("planReminders", () => {
  it("kayıt yoksa ya da her şey kapalıysa plan boş", () => {
    expect(planReminders([], "2026-11-26", { periodDaysBefore: 2, fertile: true })).toEqual([]);
    expect(planReminders(HISTORY, "2026-11-26", { periodDaysBefore: null, fertile: false })).toEqual([]);
  });

  it("adetten istenen gün kadar önce hatırlatır", () => {
    const plan = planReminders(HISTORY, "2026-11-26", { periodDaysBefore: 2, fertile: false });
    expect(plan[0]).toEqual({ kind: "period", date: "2026-12-14" });
    expect(plan.every((item) => item.kind === "period")).toBe(true);
    expect(plan.length).toBeGreaterThan(1);
  });

  it("geçmiş tarihleri atar ve tarihe göre sıralar", () => {
    const plan = planReminders(HISTORY, "2026-11-26", { periodDaysBefore: 1, fertile: true });
    expect(plan.every((item) => item.date >= "2026-11-26")).toBe(true);
    const dates = plan.map((item) => item.date);
    expect(dates).toEqual([...dates].sort());
    expect(plan.some((item) => item.kind === "fertile")).toBe(true);
  });
});
