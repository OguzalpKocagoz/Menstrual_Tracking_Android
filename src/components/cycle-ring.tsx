import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { CyclePhase } from "@/core";
import { useI18n } from "@/i18n";
import { phaseColor, useTheme } from "@/lib/theme";

const SIZE = 230;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Döngü halkası: dolu kısım döngünün ne kadarının geçtiğini, renk fazı
 * gösterir. Hesap yapmaz; değerler `buildCycleOverview` çıktısından gelir.
 */
export function CycleRing({
  cycleDay,
  cycleLength,
  phase,
  title,
  subtitle,
}: {
  cycleDay: number | null;
  cycleLength: number;
  phase: CyclePhase | null;
  title: string;
  subtitle: string | null;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const color = phaseColor(palette, phase);
  // Döngü tahminden uzun sürerse halka dolu kalır, taşmaz.
  const progress = cycleDay ? Math.min(1, cycleDay / Math.max(1, cycleLength)) : 0;

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={`${title}. ${subtitle ?? ""}`}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={palette.surfaceMuted}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        {cycleDay !== null && (
          <Text style={[styles.day, { color: palette.textMuted }]}>{t.ring.cycleDay(cycleDay)}</Text>
        )}
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: color }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: SIZE, height: SIZE, alignSelf: "center" },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 4,
  },
  day: { fontSize: 14, fontWeight: "500" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, fontWeight: "600", textAlign: "center" },
});
