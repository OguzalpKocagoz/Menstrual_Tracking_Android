import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";
import { useTheme } from "@/lib/theme";

export function Screen({
  children,
  refreshing,
  onRefresh,
  edges = ["top"],
  footer,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ("top" | "bottom")[];
  /** Kaydırılan içeriğin altında sabit duran alan (ör. reklam bandı). */
  footer?: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={edges}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={palette.brand}
              colors={[palette.brand]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return <Text style={[styles.title, { color: palette.text }]}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return <Text style={[styles.heading, { color: palette.text }]}>{children}</Text>;
}

export function Body({ children, muted, center }: { children: ReactNode; muted?: boolean; center?: boolean }) {
  const { palette } = useTheme();
  return (
    <Text
      style={[
        styles.body,
        { color: muted ? palette.textMuted : palette.text, textAlign: center ? "center" : "left" },
      ]}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "link";
  loading?: boolean;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  const inactive = disabled || loading;

  if (variant === "link") {
    return (
      <Pressable onPress={onPress} disabled={inactive} hitSlop={8} accessibilityRole="button">
        <Text style={[styles.link, { color: palette.brand, opacity: inactive ? 0.5 : 1 }]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  const background =
    variant === "primary" ? palette.brand : variant === "danger" ? palette.period : palette.surfaceMuted;
  const foreground = variant === "secondary" ? palette.text : palette.onBrand;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: inactive ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[styles.buttonText, { color: foreground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}) {
  const { palette } = useTheme();
  const accent = color ?? palette.brand;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : palette.surfaceMuted,
          borderColor: selected ? accent : palette.border,
        },
      ]}
    >
      <Text style={{ color: selected ? palette.onBrand : palette.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { palette } = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: palette.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          { color: palette.text, backgroundColor: palette.surfaceMuted, borderColor: palette.border },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

export function ErrorText({ message }: { message: string | null | undefined }) {
  const { palette } = useTheme();
  if (!message) return null;
  return (
    <Text style={[styles.body, { color: palette.period }]} accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

export function Loading() {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={palette.brand} size="large" />
    </View>
  );
}

/** Doğurganlık bilgisinin her gösterildiği yerde zorunlu uyarı. */
export function ContraceptionNotice() {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.notice, { backgroundColor: palette.ovulationSoft }]}>
      <Text style={{ color: palette.text, fontSize: 13, lineHeight: 18 }}>
        {t.contraception}
      </Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16, paddingBottom: 32 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: "700" },
  heading: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: "500" },
  link: { fontSize: 15, fontWeight: "600", textDecorationLine: "underline" },
  button: { minHeight: 48, borderRadius: 14, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 16, fontWeight: "600" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notice: { borderRadius: 12, padding: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
});
