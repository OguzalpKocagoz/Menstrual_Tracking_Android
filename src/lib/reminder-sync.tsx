import { useEffect } from "react";
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
  const { reminderPeriodDays, reminderFertile } = settings;

  useEffect(() => {
    if (!data) return;
    const plan = planReminders(data.cycles, today, {
      periodDaysBefore: reminderPeriodDays,
      fertile: reminderFertile,
    });
    // Zamanlama başarısız olursa uygulama çalışmaya devam eder; bir sonraki
    // değişiklikte yeniden denenir.
    syncReminders(plan).catch(() => {});
  }, [data, today, reminderPeriodDays, reminderFertile]);

  return null;
}
