import { useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { APP_THEMES } from "@/core";
import { ShapeGlyph } from "@/components/night-sky";
import { Body, Button, Card, Chip, ErrorText, Field, Heading, Row, Screen } from "@/components/ui";
import { authenticate, checkLockAvailability } from "@/lib/app-lock";
import { useDeleteAllRecords } from "@/lib/data";
import { LOCALE_NAMES, LOCALES, useI18n, type LanguagePreference } from "@/i18n";
import { requestReminderPermission } from "@/lib/reminders";
import { parseLength } from "@/lib/rules";
import { useSettings } from "@/lib/settings";
import { getPalette, getSky, useTheme } from "@/lib/theme";

/** Adetten kaç gün önce hatırlatılsın; null → kapalı. */
const PERIOD_REMINDER_CHOICES: readonly (number | null)[] = [null, 1, 2, 3];

const LANGUAGE_CHOICES: readonly LanguagePreference[] = ["auto", ...LOCALES];

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
  const { settings, setTheme, setLanguage, setDefaultLengths, setAppLock, setReminders } = useSettings();
  const { t, errorText } = useI18n();
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
        parseLength(cycleLength, 15, 60, "cycleLength"),
        parseLength(periodLength, 1, 12, "periodLength"),
      );
      setSaved(true);
    } catch (caught) {
      setError(errorText(caught, t.errors.saveFailed));
    }
  }

  async function toggleLock(enable: boolean) {
    setLockError(null);
    try {
      if (enable && (await checkLockAvailability()) === "no-device-lock") {
        setLockError(t.settings.noDeviceLock);
        return;
      }
      // Açarken de kapatırken de doğrulanır: telefonu eline alan biri kilidi
      // sessizce kapatamasın.
      if (await authenticate(enable ? t.settings.lockPromptOn : t.settings.lockPromptOff, t.common.cancel)) {
        setAppLock(enable);
      }
    } catch {
      setLockError(t.settings.lockFailed);
    }
  }

  async function changeReminders(periodDays: number | null, fertile: boolean) {
    setReminderError(null);
    const turningOn = periodDays !== null || fertile;
    if (turningOn && !(await requestReminderPermission(t.notifications.channel).catch(() => false))) {
      setReminderError(t.settings.permissionDenied);
      return;
    }
    setReminders(periodDays, fertile);
  }

  function confirmDeleteAll() {
    Alert.alert(t.settings.deleteAll, t.settings.deleteAllBody, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: () => deleteAll.mutate() },
    ]);
  }

  return (
    <Screen edges={[]}>
      <Card>
        <Heading>{t.settings.theme}</Heading>
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
                accessibilityLabel={t.settings.themeA11y(t.labels.theme[theme])}
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
                  {t.labels.theme[theme]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Heading>{t.settings.language}</Heading>
        <Row>
          {LANGUAGE_CHOICES.map((choice) => (
            <Chip
              key={choice}
              label={choice === "auto" ? t.settings.languageAuto : LOCALE_NAMES[choice]}
              selected={settings.language === choice}
              onPress={() => setLanguage(choice)}
            />
          ))}
        </Row>
        <Body muted>{t.settings.languageAutoHint}</Body>
      </Card>

      <Card>
        <Heading>{t.settings.lengths}</Heading>
        <Body muted>{t.settings.lengthsHint}</Body>
        <Field
          label={t.settings.cycleLength}
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="number-pad"
          placeholder="28"
        />
        <Field
          label={t.settings.periodLength}
          value={periodLength}
          onChangeText={setPeriodLength}
          keyboardType="number-pad"
          placeholder="5"
        />
        {saved && <Body muted>{t.common.saved}</Body>}
        <Button label={t.common.save} variant="secondary" onPress={saveLengths} />
      </Card>

      <ErrorText message={error} />

      <Card>
        <Heading>{t.settings.privacy}</Heading>
        <ToggleRow
          label={t.settings.appLock}
          value={settings.appLockEnabled}
          onChange={toggleLock}
        />
        <Body muted>{t.settings.appLockHint}</Body>
        <ErrorText message={lockError} />
      </Card>

      <Card>
        <Heading>{t.settings.reminders}</Heading>
        <Body muted>{t.settings.beforePeriod}</Body>
        <Row>
          {PERIOD_REMINDER_CHOICES.map((days) => (
            <Chip
              key={String(days)}
              label={days === null ? t.settings.off : t.common.days(days)}
              selected={settings.reminderPeriodDays === days}
              onPress={() => changeReminders(days, settings.reminderFertile)}
            />
          ))}
        </Row>
        <ToggleRow
          label={t.settings.fertileStart}
          value={settings.reminderFertile}
          onChange={(value) => changeReminders(settings.reminderPeriodDays, value)}
        />
        <Body muted>{t.settings.remindersHint}</Body>
        <ErrorText message={reminderError} />
      </Card>

      <Card>
        <Heading>{t.settings.data}</Heading>
        <Body muted>{t.settings.dataHint}</Body>
        <ErrorText message={deleteAll.error ? errorText(deleteAll.error) : null} />
        <Button
          label={t.settings.deleteAll}
          variant="danger"
          loading={deleteAll.isPending}
          onPress={confirmDeleteAll}
        />
      </Card>

      <Body muted>{t.disclaimer}</Body>
    </Screen>
  );
}
