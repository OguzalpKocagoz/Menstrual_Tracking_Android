import { useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { APP_THEMES, THEME_LABELS_TR } from "@/core";
import { ShapeGlyph } from "@/components/night-sky";
import { Body, Button, Card, Chip, ErrorText, Field, Heading, Row, Screen } from "@/components/ui";
import { authenticate, checkLockAvailability } from "@/lib/app-lock";
import { useDeleteAllRecords } from "@/lib/data";
import { requestReminderPermission } from "@/lib/reminders";
import { MEDICAL_DISCLAIMER } from "@/lib/disclaimer";
import { errorMessage, parseLength } from "@/lib/rules";
import { useSettings } from "@/lib/settings";
import { getPalette, getSky, useTheme } from "@/lib/theme";
import { isIntlTimeZoneSupported } from "@/lib/today";

const PERIOD_REMINDER_CHOICES: { label: string; days: number | null }[] = [
  { label: "Kapalı", days: null },
  { label: "1 gün", days: 1 },
  { label: "2 gün", days: 2 },
  { label: "3 gün", days: 3 },
];

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={{ color: palette.text, flex: 1, fontSize: 16 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: palette.brand, false: palette.border }}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, setTheme, setDefaultLengths, setAppLock, setReminders } = useSettings();
  const [lockError, setLockError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const { palette } = useTheme();
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

  async function toggleLock(enable: boolean) {
    setLockError(null);
    try {
      if (enable && (await checkLockAvailability()) === "no-device-lock") {
        setLockError("Önce telefonunun ayarlarından bir ekran kilidi (PIN, desen ya da parmak izi) kur.");
        return;
      }
      // Açarken de kapatırken de doğrulanır: telefonu eline alan biri kilidi
      // sessizce kapatamasın.
      if (await authenticate(enable ? "Uygulama kilidini aç" : "Uygulama kilidini kapat")) {
        setAppLock(enable);
      }
    } catch {
      setLockError("Kilit ayarlanamadı.");
    }
  }

  async function changeReminders(periodDays: number | null, fertile: boolean) {
    setReminderError(null);
    const turningOn = periodDays !== null || fertile;
    if (turningOn && !(await requestReminderPermission().catch(() => false))) {
      setReminderError("Bildirim izni verilmedi. Telefonun ayarlarından Döngüm için bildirimlere izin ver.");
      return;
    }
    setReminders(periodDays, fertile);
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
          {APP_THEMES.map((theme) => {
            // Önizleme temanın kendi gökyüzünden küçük bir kesit: zemin,
            // parıltı rengi ve o temada kayan şekil.
            const preview = getPalette(theme);
            const sky = getSky(theme);
            const selected = settings.theme === theme;
            return (
              <Pressable
                key={theme}
                onPress={() => setTheme(theme)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${THEME_LABELS_TR[theme]} teması`}
                style={{ alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    backgroundColor: preview.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? preview.brand : palette.border,
                    boxShadow: selected ? `0 0 14px ${sky.glowA}` : undefined,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      left: -18,
                      top: -22,
                      backgroundColor: sky.glowA,
                      opacity: 0.55,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      right: -20,
                      bottom: -22,
                      backgroundColor: sky.glowB,
                      opacity: 0.5,
                    }}
                  />
                  <ShapeGlyph shape={sky.shapes[0] ?? "sparkle"} color={sky.shapeColor} size={26} />
                </View>
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
        <Heading>Gizlilik</Heading>
        <ToggleRow
          label="Uygulama kilidi"
          value={settings.appLockEnabled}
          onChange={toggleLock}
        />
        <Body muted>
          Açılışta ve uygulamaya geri döndüğünde telefonunun kilidi (parmak izi, yüz ya da PIN) sorulur.
        </Body>
        <ErrorText message={lockError} />
      </Card>

      <Card>
        <Heading>Hatırlatmalar</Heading>
        <Body muted>Adet başlangıcından önce</Body>
        <Row>
          {PERIOD_REMINDER_CHOICES.map((choice) => (
            <Chip
              key={choice.label}
              label={choice.label}
              selected={settings.reminderPeriodDays === choice.days}
              onPress={() => changeReminders(choice.days, settings.reminderFertile)}
            />
          ))}
        </Row>
        <ToggleRow
          label="Doğurgan dönem başlarken"
          value={settings.reminderFertile}
          onChange={(value) => changeReminders(settings.reminderPeriodDays, value)}
        />
        <Body muted>
          Bildirimler sabah 09.00&apos;da gelir. Kilit ekranında görünebilecekleri için metinleri bilerek
          genel tutulur; adet ya da doğurganlık yazmaz.
        </Body>
        <ErrorText message={reminderError} />
      </Card>

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
