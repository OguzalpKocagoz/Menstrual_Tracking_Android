import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_THEME, type AppTheme, type CyclePhase } from "@/core";
import { oklch } from "./color";

/**
 * Tema renkleri.
 *
 * Uygulama her zaman web'deki özel panelin gece görünümünde: koyu zemin,
 * yıldızlı gökyüzü ve üstünde yarı saydam kartlar. Temalar yalnızca vurgu
 * rengini değil bütün görünümü renklendirir — zeminin, kartların, kenarlıkların,
 * gökyüzü parıltısının ve kayan şekillerin tonu temadan gelir. Böylece tema
 * değiştirmek bir düğme renginin değişmesi değil, başka bir gökyüzüne geçmek
 * gibi hissettiriyor.
 *
 * Açıklık/doygunluk oranları web'deki `[data-night="true"]` bloğundan alındı;
 * yalnızca ton (hue) temaya göre değişir, böylece her temada okunurluk aynı.
 * Zemin ve kartlarda doygunluk web'dekinden biraz yüksek: tema farkı ancak
 * böyle bütün ekranda hissediliyor.
 */
export interface Palette {
  /** Düz zemin. Gökyüzünün en alt katmanı ve gökyüzünün görünmediği örtüler. */
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  brand: string;
  brandStrong: string;
  brandSoft: string;
  period: string;
  periodSoft: string;
  fertile: string;
  fertileSoft: string;
  ovulation: string;
  ovulationSoft: string;
  predicted: string;
  onBrand: string;
  /** Üst bar ve alt gezinme: gökyüzü arkadan hafifçe seçilsin diye yarı saydam. */
  chrome: string;
}

/** Gökyüzünde kayan şekiller. */
export type SkyShape = "sparkle" | "star" | "moon" | "flower" | "petal" | "leaf" | "bubble" | "droplet";

export interface Sky {
  /** Arka plandaki iki renkli parıltı (web'deki bulanık radyal gradyanlar). */
  glowA: string;
  glowB: string;
  /** Kayan şekillerin rengi. */
  shapeColor: string;
  /** Yakın yıldızların hale rengi. */
  starHalo: string;
  /** Bu temanın gökyüzünde kayan şekiller; her şekil eşit olasılıkla seçilir. */
  shapes: readonly SkyShape[];
}

interface ThemeSpec {
  /** Temanın ana tonu: zemin, kartlar, vurgu ve şekiller. */
  hue: number;
  /** İkinci parıltının tonu; ana tondan farklı olunca gökyüzü derinleşiyor. */
  glowHue: number;
  period: number;
  fertile: number;
  ovulation: number;
  shapes: readonly SkyShape[];
}

const SPECS: Record<AppTheme, ThemeSpec> = {
  // Gül: kayan gül yaprakları ve küçük çiçekler.
  rose: { hue: 355, glowHue: 20, period: 15, fertile: 195, ovulation: 70, shapes: ["petal", "petal", "flower", "sparkle"] },
  // Lavanta: çiçekler ve yıldızlar.
  bloom: { hue: 300, glowHue: 330, period: 335, fertile: 215, ovulation: 60, shapes: ["flower", "flower", "star", "sparkle"] },
  // Okyanus: baloncuklar ve damlalar.
  ocean: { hue: 235, glowHue: 200, period: 20, fertile: 185, ovulation: 85, shapes: ["bubble", "bubble", "droplet", "sparkle"] },
  // Orman: süzülen yapraklar ve ateş böcekleri (parıltılar).
  forest: { hue: 155, glowHue: 115, period: 25, fertile: 190, ovulation: 85, shapes: ["leaf", "leaf", "sparkle", "sparkle"] },
  // Aurora: web'deki özel panelin kendisi — yıldızlar ve hilaller.
  aurora: { hue: 315, glowHue: 175, period: 350, fertile: 200, ovulation: 65, shapes: ["star", "moon", "sparkle", "sparkle"] },
};

function buildPalette(spec: ThemeSpec): Palette {
  const { hue } = spec;
  return {
    bg: oklch(0.16, 0.035, hue),
    surface: oklch(0.25, 0.05, hue, 0.8),
    surfaceMuted: oklch(0.31, 0.055, hue, 0.85),
    border: oklch(0.43, 0.07, hue, 0.7),
    text: oklch(0.96, 0.015, hue),
    textMuted: oklch(0.78, 0.035, hue),
    brand: oklch(0.78, 0.17, hue),
    brandStrong: oklch(0.86, 0.15, hue),
    brandSoft: oklch(0.34, 0.11, hue, 0.8),
    period: oklch(0.72, 0.18, spec.period),
    periodSoft: oklch(0.35, 0.1, spec.period, 0.8),
    fertile: oklch(0.78, 0.13, spec.fertile),
    fertileSoft: oklch(0.34, 0.08, spec.fertile, 0.8),
    ovulation: oklch(0.82, 0.14, spec.ovulation),
    ovulationSoft: oklch(0.37, 0.09, spec.ovulation, 0.8),
    predicted: oklch(0.62, 0.1, hue),
    onBrand: oklch(0.18, 0.04, hue),
    chrome: oklch(0.18, 0.04, hue, 0.72),
  };
}

function buildSky(spec: ThemeSpec): Sky {
  return {
    glowA: oklch(0.47, 0.2, spec.hue),
    glowB: oklch(0.44, 0.18, spec.glowHue),
    shapeColor: oklch(0.86, 0.13, spec.hue),
    starHalo: oklch(0.86, 0.1, spec.hue, 0.85),
    shapes: spec.shapes,
  };
}

// Paletler açılışta bir kez hesaplanır; tema değişiminde yeniden hesap yok.
const PALETTES = Object.fromEntries(
  Object.entries(SPECS).map(([theme, spec]) => [theme, buildPalette(spec)]),
) as Record<AppTheme, Palette>;

const SKIES = Object.fromEntries(
  Object.entries(SPECS).map(([theme, spec]) => [theme, buildSky(spec)]),
) as Record<AppTheme, Sky>;

export function getPalette(theme: AppTheme): Palette {
  return PALETTES[theme];
}

export function getSky(theme: AppTheme): Sky {
  return SKIES[theme];
}

/** Faz renkleri — web'deki halka ile aynı eşleme. */
export function phaseColor(palette: Palette, phase: CyclePhase | null): string {
  switch (phase) {
    case "menstrual":
      return palette.period;
    case "follicular":
      return palette.fertile;
    case "ovulation":
      return palette.ovulation;
    case "luteal":
      return palette.brand;
    default:
      return palette.textMuted;
  }
}

interface ThemeValue {
  palette: Palette;
  sky: Sky;
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ theme, children }: { theme: AppTheme | null; children: ReactNode }) {
  const resolved = theme ?? DEFAULT_THEME;
  const value = useMemo(
    () => ({ palette: getPalette(resolved), sky: getSky(resolved), theme: resolved }),
    [resolved],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme, ThemeProvider içinde kullanılmalı.");
  return value;
}
