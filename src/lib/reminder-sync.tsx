import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { useCycleData, useToday } from "./data";
import { planReminders } from "./reminder-plan";
import { syncReminders } from "./reminders";
import { useSettings } from "./settings";

/**
 * Hatırlatmaları veriyle eşit tutar: döngü kaydı, ayar ya da gün değişince
 * plan yeniden hesaplanır ve zamanlanmış bildirimler baştan kurulur.
 * Ekranda bir şey çizmez.
 */
export function ReminderSync() {
  const { settings } = useSettings();
  const { data } = useCycleData();
  const today = useToday();
  const { t } = useI18n();
  const { reminderPeriodDays, reminderFertile } = settings;

  useEffect(() => {
    if (!data) return;
    const plan = planReminders(data.cycles, today, {
      periodDaysBefore: reminderPeriodDays,
      fertile: reminderFertile,
    });
    // Zamanlama başarısız olursa uygulama çalışmaya devam eder; bir sonraki
    // değişiklikte yeniden denenir.
    syncReminders(plan, {
      title: t.common.appName,
      channel: t.notifications.channel,
      body: { period: t.notifications.period, fertile: t.notifications.fertile },
    }).catch(() => {});
    // Dil değişince zamanlanmış bildirimler de yeni dilde yeniden kurulur.
  }, [data, today, reminderPeriodDays, reminderFertile, t]);

  return null;
}
