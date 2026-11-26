import { StyleSheet, Text, View } from "react-native";
import { PHASE_ALIAS_TR, PHASE_LABELS_TR, type CyclePhase, type PhaseRange } from "@/core";
import { phaseColor, useTheme } from "@/lib/theme";

/**
 * Dört fazın gün aralıkları. `getPhaseRanges` daima dört öğe döndürür; süresi
 * sıfır olan faz da listede kalır ve "—" olarak gösterilir (ör. çok uzun
 * kanama foliküler fazı yuttuysa).
 */
export function PhaseStrip({ ranges, active }: { ranges: PhaseRange[]; active: CyclePhase | null }) {
  const { palette } = useTheme();
  const total = ranges.reduce((sum, range) => sum + range.dayCount, 0) || 1;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.bar}>
        {ranges.map((range) =>
          range.dayCount > 0 ? (
            <View
              key={range.phase}
              style={{
                flex: range.dayCount / total,
                backgroundColor: phaseColor(palette, range.phase),
                opacity: active && active !== range.phase ? 0.35 : 1,
              }}
            />
          ) : null,
        )}
      </View>
      {ranges.map((range) => {
        const isActive = range.phase === active;
        const alias = PHASE_ALIAS_TR[range.phase];
        return (
          <View key={range.phase} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: phaseColor(palette, range.phase) }]} />
            <Text
              style={[
                styles.label,
                { color: palette.text, fontWeight: isActive ? "700" : "400" },
              ]}
            >
              {PHASE_LABELS_TR[range.phase]}
              {alias ? ` (${alias})` : ""}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 14 }}>
              {range.dayCount === 0
                ? "—"
                : range.startDay === range.endDay
                  ? `${range.startDay}. gün`
                  : `${range.startDay}–${range.endDay}. gün`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 15 },
});
