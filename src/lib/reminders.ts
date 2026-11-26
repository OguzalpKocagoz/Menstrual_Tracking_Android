import * as Notifications from "expo-notifications";
import { AndroidImportance, AndroidNotificationVisibility } from "expo-notifications";
import { Platform } from "react-native";
import type { PlannedReminder, ReminderKind } from "./reminder-plan";

/**
 * Yerel bildirimler. Sunucu ve push yok: hatırlatmalar telefonda zamanlanır.
 *
 * Metinler bilerek nötr: bildirim kilit ekranında ve başkalarının görebileceği
 * yerlerde çıkar; "adet" ya da "doğurgan" kelimesi sağlık bilgisini açık eder.
 * Kanal da kilit ekranında içeriği gizleyecek şekilde (PRIVATE) açılır.
 */

const CHANNEL_ID = "hatirlatmalar";
/** Hatırlatmaların gideceği saat (yerel). */
const REMINDER_HOUR = 9;

const TEXT: Record<ReminderKind, string> = {
  period: "Takviminde yaklaşan bir gün var.",
  fertile: "Takviminde bugün yeni bir dönem başlıyor.",
};

let configured = false;

async function configure(): Promise<void> {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Hatırlatmalar",
      importance: AndroidImportance.DEFAULT,
      lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
    });
  }
}

/** İzin ister; Android 13+ sistem penceresi çıkar. Verildiyse true. */
export async function requestReminderPermission(): Promise<boolean> {
  await configure();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function triggerDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year!, month! - 1, day!, REMINDER_HOUR, 0, 0);
}

/**
 * Bütün zamanlanmış hatırlatmaları silip plana göre yeniden kurar. Veri ya da
 * ayar her değiştiğinde çağrılır; tek kaynak plan olduğu için eski ve yeni
 * hatırlatmalar karışmaz.
 */
export async function syncReminders(plan: readonly PlannedReminder[]): Promise<void> {
  await configure();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (plan.length === 0) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const now = Date.now();
  for (const item of plan) {
    const date = triggerDate(item.date);
    if (date.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: "Döngüm", body: TEXT[item.kind] },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
  }
}
