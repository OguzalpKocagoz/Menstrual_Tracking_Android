/**
 * oklch → sRGB hex dönüştürücü.
 *
 * Web'deki gece görünümü renkleri oklch ile yazılı; React Native oklch'yi
 * tanımıyor. Temaların gece paletleri tek bir ton açısından (hue) türetildiği
 * için değerleri elle çevirmek yerine burada hesaplıyoruz: yeni tema eklemek
 * tek satır, ve açıklık/doygunluk oranları bütün temalarda aynı kalıyor.
 *
 * sRGB'ye sığmayan renklerde doygunluk, renk sığana kadar düşürülür (ton ve
 * açıklık korunur). Kanalları kırpmak tonu kaydırıyor; özellikle yüksek
 * doygunluklu mor/mavilerde fark gözle görülüyor.
 */

function toLinearRgb(l: number, c: number, h: number): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const EPSILON = 1e-4;

function inGamut(rgb: [number, number, number]): boolean {
  return rgb.every((channel) => channel >= -EPSILON && channel <= 1 + EPSILON);
}

function gamma(channel: number): number {
  const x = Math.min(1, Math.max(0, channel));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
}

function hex2(value: number): string {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, "0");
}

/**
 * `oklch(l c h / alpha)` karşılığı hex. Alfa 1'den küçükse 8 haneli
 * (#rrggbbaa) döner; React Native bu biçimi destekliyor.
 */
export function oklch(l: number, c: number, h: number, alpha = 1): string {
  let rgb = toLinearRgb(l, c, h);

  if (!inGamut(rgb)) {
    // İkili arama: sığan en yüksek doygunluk.
    let low = 0;
    let high = c;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (inGamut(toLinearRgb(l, mid, h))) low = mid;
      else high = mid;
    }
    rgb = toLinearRgb(l, low, h);
  }

  const base = `#${rgb.map((channel) => hex2(gamma(channel))).join("")}`;
  return alpha < 1 ? `${base}${hex2(alpha)}` : base;
}
