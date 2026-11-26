import { describe, expect, it } from "vitest";
import { UserError } from "@/core";
import { en } from "./en";
import { createFormatters, describeError, resolveLocale } from "./format";
import { tr } from "./tr";

describe("resolveLocale", () => {
  it("otomatikte telefon Türkçe ise Türkçe, diğer her dilde İngilizce", () => {
    expect(resolveLocale("auto", "tr")).toBe("tr");
    expect(resolveLocale("auto", "en")).toBe("en");
    expect(resolveLocale("auto", "de")).toBe("en");
    expect(resolveLocale("auto", null)).toBe("en");
  });

  it("elle seçilen dil telefon dilini ezer", () => {
    expect(resolveLocale("tr", "en")).toBe("tr");
    expect(resolveLocale("en", "tr")).toBe("en");
  });
});

describe("tarih biçimleri", () => {
  const trFormat = createFormatters(tr);
  const enFormat = createFormatters(en);

  it("Türkçe", () => {
    expect(trFormat.date("2026-11-26")).toBe("26 Kasım 2026");
    expect(trFormat.shortDate("2026-11-26")).toBe("26 Kasım");
    expect(trFormat.month(2026, 2)).toBe("Şubat 2026");
  });

  it("İngilizce", () => {
    expect(enFormat.date("2026-11-26")).toBe("November 26, 2026");
    expect(enFormat.shortDate("2026-11-26")).toBe("Nov 26");
    expect(enFormat.month(2026, 2)).toBe("February 2026");
  });

  it("göreli günler", () => {
    expect([0, 1, -1, 5, -3].map(trFormat.relativeDays)).toEqual([
      "bugün",
      "yarın",
      "dün",
      "5 gün sonra",
      "3 gün önce",
    ]);
    expect([0, 1, -1, 5, -1 * 1].map(enFormat.relativeDays)).toEqual([
      "today",
      "tomorrow",
      "yesterday",
      "in 5 days",
      "yesterday",
    ]);
    expect(enFormat.relativeDays(-3)).toBe("3 days ago");
  });
});

describe("describeError", () => {
  it("kullanıcı hatasını seçili dilde, parametreleriyle yazar", () => {
    const error = new UserError("lengthRange", { field: "periodLength", min: 1, max: 12 });
    expect(describeError(tr, error)).toBe("Regl süresi 1–12 gün arasında olmalı.");
    expect(describeError(en, error)).toBe("Period length must be between 1 and 12 days.");
    expect(describeError(en, new UserError("periodTooLong", { max: 12 }))).toBe(
      "A period can't be longer than 12 days.",
    );
  });

  it("beklenmeyen hatanın ham metnini göstermez", () => {
    const raw = new Error("SQLITE_IOERR /data/data/...");
    expect(describeError(tr, raw)).toBe(tr.errors.unexpected);
    expect(describeError(en, raw, "Fallback")).toBe("Fallback");
  });
});

describe("sözlükler", () => {
  it("İngilizce sözlükte boş metin yok", () => {
    const empty: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === "string" && value.trim() === "") empty.push(path);
      else if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
      }
    };
    walk(en, "en");
    expect(empty).toEqual([]);
  });
});
