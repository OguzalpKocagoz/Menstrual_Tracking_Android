import { describe, expect, it } from "vitest";
import { oklch } from "./color";

describe("oklch", () => {
  it("siyah ve beyazı doğru çevirir", () => {
    expect(oklch(0, 0, 0)).toBe("#000000");
    expect(oklch(1, 0, 0)).toBe("#ffffff");
  });

  it("bilinen bir rengi çevirir (sRGB kırmızı)", () => {
    expect(oklch(0.62796, 0.25768, 29.2339)).toBe("#ff0000");
  });

  it("alfa verilince 8 haneli hex döner", () => {
    expect(oklch(1, 0, 0, 0.5)).toBe("#ffffff80");
    expect(oklch(1, 0, 0, 1)).toBe("#ffffff");
  });

  it("gamut dışı renkte geçerli bir hex üretir ve tonu korur", () => {
    // Bu doygunluk sRGB'ye sığmaz; kırpma yerine doygunluk düşürülmeli.
    const color = oklch(0.78, 0.4, 315);
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    // 315° mor-pembe: kırmızı ve mavi yeşilden belirgin şekilde yüksek.
    expect(r).toBeGreaterThan(g + 40);
    expect(b).toBeGreaterThan(g + 40);
  });
});
