import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { DEFAULT_THEME, type AppTheme, type CyclePhase } from "@/core";

/**
 * Tema renkleri.
 *
 * Değerler web'deki `globals.css`'ten (oklch) sRGB hex'e çevrilerek alındı;
 * React Native oklch'yi tanımıyor. Koyu modda parlaklık yükseltilir,
 * doygunluk düşürülür — web ile aynı kural. Tema hesap başına saklanır.
 */
export interface Palette {
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
}

type Accent = Omit<Palette, "bg" | "surface" | "surfaceMuted" | "border" | "text" | "textMuted" | "onBrand">;

const BASE_LIGHT = {
  bg: "#fefafd",
  surface: "#ffffff",
  surfaceMuted: "#f9f3f7",
  border: "#e6dfe3",
  text: "#251c24",
  textMuted: "#736871",
  onBrand: "#ffffff",
};

const BASE_DARK = {
  bg: "#120e12",
  surface: "#1f181e",
  surfaceMuted: "#282127",
  border: "#383037",
  text: "#f2edf1",
  textMuted: "#aaa1a9",
  onBrand: "#120e12",
};

const ACCENTS: Record<AppTheme, { light: Accent; dark: Accent }> = {
  rose: {
    light: {
      brand: "#d03765", brandStrong: "#b7014d", brandSoft: "#ffe7eb",
      period: "#d23855", periodSoft: "#ffdbdd", fertile: "#00a099", fertileSoft: "#cef4f1",
      ovulation: "#da950b", ovulationSoft: "#ffeac2", predicted: "#ca8a95",
    },
    dark: {
      brand: "#ef6e8b", brandStrong: "#ff8ba5", brandSoft: "#472028",
      period: "#e35b6d", periodSoft: "#512227", fertile: "#30b4ad", fertileSoft: "#033633",
      ovulation: "#e8aa4e", ovulationSoft: "#47300c", predicted: "#9e5a67",
    },
  },
  bloom: {
    light: {
      brand: "#854ece", brandStrong: "#7233bb", brandSoft: "#f2e9ff",
      period: "#ad36a7", periodSoft: "#ffe0fb", fertile: "#0097bc", fertileSoft: "#cff2fe",
      ovulation: "#eb883b", ovulationSoft: "#ffe5c9", predicted: "#a18cc8",
    },
    dark: {
      brand: "#b58bf9", brandStrong: "#cda6ff", brandSoft: "#33244b",
      period: "#d16cc9", periodSoft: "#462444", fertile: "#25afd2", fertileSoft: "#07333f",
      ovulation: "#f7a062", ovulationSoft: "#4d2c15", predicted: "#7b63a3",
    },
  },
  ocean: {
    light: {
      brand: "#0081b6", brandStrong: "#0069a1", brandSoft: "#d1f1ff",
      period: "#c74a51", periodSoft: "#ffdfdd", fertile: "#009d9e", fertileSoft: "#cdf4f3",
      ovulation: "#c09910", ovulationSoft: "#feeec1", predicted: "#61a2c0",
    },
    dark: {
      brand: "#32b3e6", brandStrong: "#60ccfc", brandSoft: "#003346",
      period: "#e66d71", periodSoft: "#512224", fertile: "#16bbbc", fertileSoft: "#023536",
      ovulation: "#deba50", ovulationSoft: "#41340a", predicted: "#317e9f",
    },
  },
  forest: {
    light: {
      brand: "#007e46", brandStrong: "#006a2f", brandSoft: "#d7f4e0",
      period: "#c13c3b", periodSoft: "#ffdfda", fertile: "#009d90", fertileSoft: "#cff4ef",
      ovulation: "#d29922", ovulationSoft: "#ffebc2", predicted: "#69a17d",
    },
    dark: {
      brand: "#51b67a", brandStrong: "#73ce95", brandSoft: "#0c341e",
      period: "#ea6a64", periodSoft: "#512320", fertile: "#3dbbae", fertileSoft: "#053631",
      ovulation: "#e9b452", ovulationSoft: "#45310b", predicted: "#42815a",
    },
  },
  aurora: {
    light: {
      brand: "#9c40bf", brandStrong: "#851ca9", brandSoft: "#f8e2ff",
      period: "#c23492", periodSoft: "#ffdef3", fertile: "#00a1b4", fertileSoft: "#c5f6fb",
      ovulation: "#e78c08", ovulationSoft: "#ffe6be", predicted: "#b085c3",
    },
    dark: {
      brand: "#d689f7", brandStrong: "#eba2ff", brandSoft: "#3f224c",
      period: "#e969b8", periodSoft: "#51223f", fertile: "#00c2d2", fertileSoft: "#00393f",
      ovulation: "#fba952", ovulationSoft: "#502f08", predicted: "#8e65a0",
    },
  },
};

/** Aurora'nın kendi zemin tonları var; diğer temalar ortak zemini kullanır. */
const AURORA_BASE = {
  light: { bg: "#f6f3fc", surface: "#ffffff", surfaceMuted: "#f0ecf9", border: "#ddd8e8", text: "#211c2b", textMuted: "#6b6578" },
  dark: { bg: "#110d19", surface: "#1d1727", surfaceMuted: "#292334", border: "#383145", text: "#efedf6", textMuted: "#a6a2b1" },
};

export function getPalette(theme: AppTheme, scheme: "light" | "dark"): Palette {
  const base = scheme === "dark" ? BASE_DARK : BASE_LIGHT;
  const surfaces = theme === "aurora" ? { ...base, ...AURORA_BASE[scheme] } : base;
  return { ...surfaces, ...ACCENTS[theme][scheme] };
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
  scheme: "light" | "dark";
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ theme, children }: { theme: AppTheme | null; children: ReactNode }) {
  const scheme: "light" | "dark" = useColorScheme() === "dark" ? "dark" : "light";
  const resolved = theme ?? DEFAULT_THEME;
  const value = useMemo(
    () => ({ palette: getPalette(resolved, scheme), scheme, theme: resolved }),
    [resolved, scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme, ThemeProvider içinde kullanılmalı.");
  return value;
}
