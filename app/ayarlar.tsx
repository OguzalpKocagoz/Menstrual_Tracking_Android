import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { STANDARD_THEMES, THEME_LABELS_TR } from "@/core";
import { Body, Button, Card, ErrorText, Field, Heading, Screen } from "@/components/ui";
import { useDeleteAllRecords } from "@/lib/data";
import { MEDICAL_DISCLAIMER } from "@/lib/disclaimer";
import { errorMessage, parseLength } from "@/lib/rules";
import { useSettings } from "@/lib/settings";
import { getPalette, useTheme } from "@/lib/theme";
import { isIntlTimeZoneSupported } from "@/lib/today";

export default function SettingsScreen() {
  const { settings, setTheme, setDefaultLengths } = useSettings();
  const { palette, scheme } = useTheme();
  const deleteAll = useDeleteAllRecords();
  const [cycleLength, setCycleLength] = useState(String(settings.defaultCycleLength ?? ""));
  const [periodLength, setPeriodLength] = useState(String(settings.defaultPeriodLength ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function saveLengths() {
    setError(null);
    setSaved(false);
    try {
      setDefaultLengths(
        parseLength(cycleLength, 15, 60, "Döngü uzunluğu"),
        parseLength(periodLength, 1, 12, "Regl süresi"),
      );
      setSaved(true);
    } catch (caught) {
      setError(errorMessage(caught, "Kaydedilemedi."));
    }
  }

  function confirmDeleteAll() {
    Alert.alert(
      "Tüm kayıtları sil",
      "Bu telefondaki bütün döngü ve günlük kayıtların kalıcı olarak silinecek. Geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => deleteAll.mutate() },
      ],
    );
  }

  return (
    <Screen edges={[]}>
      <Card>
        <Heading>Tema</Heading>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {STANDARD_THEMES.map((theme) => {
            const preview = getPalette(theme, scheme);
            const selected = settings.theme === theme;
            return (
              <Pressable
                key={theme}
                onPress={() => setTheme(theme)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{ alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: preview.brand,
                    borderWidth: selected ? 3 : 0,
                    borderColor: palette.text,
                  }}
                />
                <Text style={{ color: palette.text, fontWeight: selected ? "700" : "400" }}>
                  {THEME_LABELS_TR[theme]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Heading>Varsayılan uzunluklar</Heading>
        <Body muted>Boş bırakılırsa kayıtlarından hesaplanır.</Body>
        <Field
          label="Döngü uzunluğu (gün)"
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="number-pad"
          placeholder="28"
        />
        <Field
          label="Regl süresi (gün)"
          value={periodLength}
          onChangeText={setPeriodLength}
          keyboardType="number-pad"
          placeholder="5"
        />
        {saved && <Body muted>Kaydedildi.</Body>}
        <Button label="Kaydet" variant="secondary" onPress={saveLengths} />
      </Card>

      <ErrorText message={error} />

      <Card>
        <Heading>Verilerin</Heading>
        <Body muted>
          Kayıtların yalnızca bu telefonda saklanır, hiçbir sunucuya gönderilmez. Uygulamayı silersen
          kayıtlar da silinir; telefonunun Google yedeği açıksa yeni telefona geri yüklenir.
        </Body>
        <ErrorText message={deleteAll.error ? errorMessage(deleteAll.error) : null} />
        <Button
          label="Tüm kayıtları sil"
          variant="danger"
          loading={deleteAll.isPending}
          onPress={confirmDeleteAll}
        />
      </Card>

      <Body muted>{MEDICAL_DISCLAIMER}</Body>

      {!isIntlTimeZoneSupported() && (
        <Body muted>
          {"Not: Bu cihazda saat dilimi verisi bulunamadı; “bugün” sabit UTC+3’e göre hesaplanıyor."}
        </Body>
      )}
    </Screen>
  );
}
