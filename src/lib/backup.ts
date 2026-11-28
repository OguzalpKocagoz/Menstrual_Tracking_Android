import { isISODate, UserError, type Cycle, type DailyLog } from "@/core";
import { assertPeriodRange, sanitizeLog } from "./rules";

/**
 * Yedek dosyası biçimi (dışa/içe aktarma).
 *
 * Saf fonksiyonlar: dosya sistemine ve React Native'e bağlı değiller, bu
 * yüzden Node'da test edilirler. Dosyayı yazma/okuma `backup-file.ts`'te.
 *
 * Geri yüklenen dosya kullanıcıdan gelir — elle düzenlenmiş, bozulmuş ya da
 * başka bir uygulamaya ait olabilir. Bu yüzden her alan, uygulamanın kendi
 * kayıt kurallarından (`rules.ts`) yeniden geçirilir; tek bir hatalı kayıt
 * bütün dosyayı reddeder. Yarım yüklenmiş bir yedek, hiç yüklenmemişinden
 * daha tehlikeli: kullanıcı verisinin tamam olduğunu sanır.
 */

export const BACKUP_FORMAT = "dongum-backup";
export const BACKUP_VERSION = 1;

export interface BackupData {
  cycles: Cycle[];
  logs: DailyLog[];
}

export interface BackupFile extends BackupData {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
}

export function createBackup(data: BackupData, exportedAt: Date): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    cycles: data.cycles.map((cycle) => ({
      id: cycle.id,
      startDate: cycle.startDate,
      periodEndDate: cycle.periodEndDate,
      notes: cycle.notes ?? null,
      predictedStartDate: cycle.predictedStartDate ?? null,
    })),
    logs: data.logs,
  };
}

/** Yedek dosyasının adı: "dongum-yedek-2026-11-27.json" */
export function backupFileName(today: string): string {
  return `dongum-yedek-${today}.json`;
}

function invalid(): never {
  throw new UserError("invalidBackup");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid();
  return value;
}

function optionalDate(value: unknown): string | null {
  const text = optionalString(value);
  if (text !== null && !isISODate(text)) invalid();
  return text;
}

function parseCycle(value: unknown): Cycle {
  if (!isRecord(value)) invalid();
  const { id, startDate } = value;
  if (typeof id !== "string" || id.trim() === "") invalid();
  if (typeof startDate !== "string" || !isISODate(startDate)) invalid();
  const periodEndDate = optionalDate(value.periodEndDate);
  try {
    assertPeriodRange(startDate, periodEndDate);
  } catch {
    invalid();
  }
  return {
    id,
    startDate,
    periodEndDate,
    notes: optionalString(value.notes),
    predictedStartDate: optionalDate(value.predictedStartDate),
  };
}

function parseLog(value: unknown): DailyLog {
  if (!isRecord(value)) invalid();
  const { date } = value;
  if (typeof date !== "string" || !isISODate(date)) invalid();
  if (!Array.isArray(value.symptoms ?? [])) invalid();
  const temperature = value.temperatureC ?? null;
  if (temperature !== null && typeof temperature !== "number") invalid();
  try {
    const log = sanitizeLog({
      flow: (optionalString(value.flow) as DailyLog["flow"]) ?? null,
      mood: (optionalString(value.mood) as DailyLog["mood"]) ?? null,
      symptoms: (value.symptoms ?? []) as DailyLog["symptoms"],
      notes: optionalString(value.notes),
      temperatureC: temperature,
    });
    return { date, ...log };
  } catch {
    invalid();
  }
}

/**
 * Dosya metnini doğrulayıp kayıtlara çevirir. Geçersizse `UserError("invalidBackup")`.
 */
export function parseBackup(text: string): BackupData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    invalid();
  }
  if (!isRecord(raw) || raw.format !== BACKUP_FORMAT) invalid();
  // Daha yeni bir sürümün dosyası: alanları yanlış yorumlamaktansa reddet.
  if (typeof raw.version !== "number" || raw.version > BACKUP_VERSION) invalid();
  if (!Array.isArray(raw.cycles) || !Array.isArray(raw.logs)) invalid();

  const cycles = raw.cycles.map(parseCycle);
  const logs = raw.logs.map(parseLog);

  // Veritabanındaki tekillik kuralları: aynı gün iki döngü ya da iki günlük olamaz.
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (!unique(cycles.map((cycle) => cycle.startDate)) || !unique(cycles.map((cycle) => cycle.id))) invalid();
  if (!unique(logs.map((log) => log.date))) invalid();

  return { cycles, logs };
}
