import { describe, expect, it } from "vitest";
import {
  addDays,
  buildMonthGrid,
  daysBetween,
  daysInMonth,
  endOfMonth,
  getWeekdayIndex,
  inclusiveDayCount,
  isISODate,
  todayISO,
} from "./date";

describe("tarih doğrulama", () => {
  it("geçerli tarihleri kabul eder", () => {
    expect(isISODate("2026-07-26")).toBe(true);
    expect(isISODate("2024-02-29")).toBe(true); // artık yıl
  });

  it("takvimde var olmayan tarihleri reddeder", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2025-02-29")).toBe(false); // artık yıl değil
    expect(isISODate("2026-13-01")).toBe(false);
    expect(isISODate("26-07-2026")).toBe(false);
    expect(isISODate("")).toBe(false);
    expect(isISODate(null)).toBe(false);
  });
});

describe("gün aritmetiği", () => {
  it("ay sınırını geçer", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("yıl sınırını geçer", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("artık yılı doğru işler", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
  });

  it("geriye doğru sayar", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("aradaki gün farkını hesaplar", () => {
    expect(daysBetween("2026-07-01", "2026-07-29")).toBe(28);
    expect(daysBetween("2026-07-29", "2026-07-01")).toBe(-28);
    expect(daysBetween("2026-07-01", "2026-07-01")).toBe(0);
  });

  it("iki ucu dahil gün sayısını verir", () => {
    // 1-5 Temmuz arası 5 gün süren bir regl
    expect(inclusiveDayCount("2026-07-01", "2026-07-05")).toBe(5);
  });

  it("yaz saati geçişinde kaymaz", () => {
    // Türkiye'de saat değişimi kaldırıldı ama kullanıcı başka saat diliminde
    // olabilir; hesap UTC gün sayısı üzerinden yapıldığı için etkilenmemeli.
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });
});

describe("ay yardımcıları", () => {
  it("ayın gün sayısını bulur", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 7)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("ayın son gününü verir", () => {
    expect(endOfMonth(2026, 2)).toBe("2026-02-28");
    expect(endOfMonth(2026, 12)).toBe("2026-12-31");
  });

  it("haftanın gününü pazartesi=0 olarak verir", () => {
    expect(getWeekdayIndex("2026-07-27")).toBe(0); // pazartesi
    expect(getWeekdayIndex("2026-07-26")).toBe(6); // pazar
  });
});

describe("takvim ızgarası", () => {
  it("tam haftalardan oluşur ve pazartesi ile başlar", () => {
    const grid = buildMonthGrid(2026, 7);
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
    expect(getWeekdayIndex(grid[0]![0]!)).toBe(0);
  });

  it("ayın tüm günlerini içerir", () => {
    const grid = buildMonthGrid(2026, 2);
    const flat = grid.flat();
    expect(flat).toContain("2026-02-01");
    expect(flat).toContain("2026-02-28");
  });

  it("ay pazartesi başlayıp 28 çekince tek ızgara taşması olmaz", () => {
    // Şubat 2027 pazartesi başlar ve 28 gün çeker: tam 4 hafta.
    expect(getWeekdayIndex("2027-02-01")).toBe(0);
    expect(buildMonthGrid(2027, 2)).toHaveLength(4);
  });
});

describe("biçimlendirme", () => {

  it("bugünü yerel saate göre üretir", () => {
    // Yerel gece yarısı sonrası UTC'de hâlâ önceki gün olsa bile
    // kullanıcının gördüğü tarih değişmemeli.
    const localMidnight = new Date(2026, 6, 26, 0, 30);
    expect(todayISO(localMidnight)).toBe("2026-07-26");
  });
});
