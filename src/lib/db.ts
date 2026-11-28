import { openDatabaseSync } from "expo-sqlite";
import { UserError, type Cycle, type DailyLog, type ISODate } from "@/core";
import {
  assertPeriodRange,
  assertStartDate,
  capturePrediction,
  isEmptyLog,
  sanitizeLog,
  type DailyLogInput,
} from "./rules";
import { getToday } from "./today";

/**
 * Telefondaki veritabanı.
 *
 * Hesap ve sunucu yok: döngüler, günlük kayıtlar ve ayarlar yalnızca bu
 * cihazda, uygulamanın özel klasöründeki SQLite dosyasında durur. Android'in
 * otomatik yedeği açıksa bu dosya kullanıcının Google Drive'ına yedeklenir ve
 * yeni telefonda geri gelir.
 *
 * Kurallar (`rules.ts`) yazmadan önce burada uygulanır; ekranlar doğrudan SQL
 * çalıştırmaz.
 */

const db = openDatabaseSync("dongum.db");

/**
 * Şema sürümleri. Yeni bir değişiklik listenin SONUNA eklenir; var olan bir
 * adım değiştirilmez, çünkü telefonlarda zaten çalışmış olabilir.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE cycles (
     id TEXT PRIMARY KEY NOT NULL,
     start_date TEXT NOT NULL UNIQUE,
     period_end_date TEXT,
     notes TEXT,
     predicted_start_date TEXT
   );
   CREATE TABLE daily_logs (
     date TEXT PRIMARY KEY NOT NULL,
     flow TEXT,
     mood TEXT,
     symptoms TEXT NOT NULL DEFAULT '[]',
     notes TEXT,
     temperature_c REAL
   );
   CREATE TABLE settings (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );`,
];

function migrate(): void {
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[version]!);
      db.execSync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

migrate();

// ---------------------------------------------------------------------------
// Döngüler ve günlükler
// ---------------------------------------------------------------------------

interface CycleRow {
  id: string;
  start_date: string;
  period_end_date: string | null;
  notes: string | null;
  predicted_start_date: string | null;
}

interface LogRow {
  date: string;
  flow: string | null;
  mood: string | null;
  symptoms: string;
  notes: string | null;
  temperature_c: number | null;
}

function toCycle(row: CycleRow): Cycle {
  return {
    id: row.id,
    startDate: row.start_date,
    periodEndDate: row.period_end_date,
    notes: row.notes,
    predictedStartDate: row.predicted_start_date,
  };
}

function toLog(row: LogRow): DailyLog {
  let symptoms: DailyLog["symptoms"] = [];
  try {
    const parsed: unknown = JSON.parse(row.symptoms);
    if (Array.isArray(parsed)) symptoms = parsed as DailyLog["symptoms"];
  } catch {
    // Bozuk alan boş sayılır; kayıt yine gösterilir.
  }
  return {
    date: row.date,
    flow: row.flow as DailyLog["flow"],
    mood: row.mood as DailyLog["mood"],
    symptoms,
    notes: row.notes,
    temperatureC: row.temperature_c,
  };
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function allCycles(): Promise<Cycle[]> {
  const rows = await db.getAllAsync<CycleRow>("SELECT * FROM cycles ORDER BY start_date ASC");
  return rows.map(toCycle);
}

async function findCycle(id: string): Promise<Cycle> {
  const row = await db.getFirstAsync<CycleRow>("SELECT * FROM cycles WHERE id = ?", id);
  if (!row) throw new UserError("cycleNotFound");
  return toCycle(row);
}

export interface CycleData {
  cycles: Cycle[];
  logs: DailyLog[];
  today: ISODate;
}

/** Ana ekran, takvim, doğurganlık ve istatistik bu tek çağrıdan beslenir. */
export async function loadCycleData(): Promise<CycleData> {
  const [cycles, logRows] = await Promise.all([
    allCycles(),
    db.getAllAsync<LogRow>("SELECT * FROM daily_logs ORDER BY date ASC"),
  ]);
  return { cycles, logs: logRows.map(toLog), today: getToday() };
}

/**
 * "Adetim başladı". Aynı gün için ikinci kez çağrılırsa yeni kayıt açmaz —
 * yanlışlıkla iki kez basmak istatistikleri bozmamalı.
 */
export async function startPeriod(date: ISODate): Promise<Cycle> {
  const today = getToday();
  assertStartDate(date, today);

  const existing = await db.getFirstAsync<CycleRow>("SELECT * FROM cycles WHERE start_date = ?", date);
  if (existing) return toCycle(existing);

  const cycle: Cycle = {
    id: newId(),
    startDate: date,
    periodEndDate: null,
    notes: null,
    predictedStartDate: capturePrediction(await allCycles(), date, today),
  };
  await db.runAsync(
    "INSERT INTO cycles (id, start_date, period_end_date, notes, predicted_start_date) VALUES (?, ?, NULL, NULL, ?)",
    cycle.id,
    cycle.startDate,
    cycle.predictedStartDate ?? null,
  );
  return cycle;
}

/** "Adetim bitti". `cycleId` verilmezse en son döngü bitirilir. */
export async function endPeriod(date: ISODate, cycleId?: string): Promise<Cycle> {
  let cycle: Cycle;
  if (cycleId) {
    cycle = await findCycle(cycleId);
  } else {
    const latest = await db.getFirstAsync<CycleRow>("SELECT * FROM cycles ORDER BY start_date DESC LIMIT 1");
    if (!latest) throw new UserError("noCycleToEnd");
    cycle = toCycle(latest);
  }

  assertPeriodRange(cycle.startDate, date);
  await db.runAsync("UPDATE cycles SET period_end_date = ? WHERE id = ?", date, cycle.id);
  return { ...cycle, periodEndDate: date };
}

/** Bitiş işaretini geri alır ("Geri al"). */
export async function clearPeriodEnd(cycleId: string): Promise<void> {
  await findCycle(cycleId);
  await db.runAsync("UPDATE cycles SET period_end_date = NULL WHERE id = ?", cycleId);
}

export async function deleteCycle(cycleId: string): Promise<void> {
  const result = await db.runAsync("DELETE FROM cycles WHERE id = ?", cycleId);
  if (result.changes === 0) throw new UserError("cycleNotFound");
}

export async function getDailyLog(date: ISODate): Promise<DailyLog | null> {
  const row = await db.getFirstAsync<LogRow>("SELECT * FROM daily_logs WHERE date = ?", date);
  return row ? toLog(row) : null;
}

/** Gün başına tek kayıt: ekleme ve güncelleme aynı işlem. Boş kayıt silinir. */
export async function saveDailyLog(date: ISODate, input: DailyLogInput): Promise<DailyLog | null> {
  const log = sanitizeLog(input);
  if (isEmptyLog(log)) {
    await db.runAsync("DELETE FROM daily_logs WHERE date = ?", date);
    return null;
  }
  await db.runAsync(
    `INSERT INTO daily_logs (date, flow, mood, symptoms, notes, temperature_c)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       flow = excluded.flow, mood = excluded.mood, symptoms = excluded.symptoms,
       notes = excluded.notes, temperature_c = excluded.temperature_c`,
    date,
    log.flow,
    log.mood,
    JSON.stringify(log.symptoms),
    log.notes,
    log.temperatureC,
  );
  return { date, ...log };
}

/**
 * Yedekten geri yükleme: mevcut döngü ve günlük kayıtlarını dosyadakilerle
 * değiştirir. Tek işlem (transaction) içinde: yazma yarıda kalırsa eski
 * kayıtlar olduğu gibi kalır. Kayıtlar `parseBackup`'tan doğrulanmış gelir.
 */
export async function replaceAllRecords(cycles: Cycle[], logs: DailyLog[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM cycles");
    await db.runAsync("DELETE FROM daily_logs");
    for (const cycle of cycles) {
      await db.runAsync(
        "INSERT INTO cycles (id, start_date, period_end_date, notes, predicted_start_date) VALUES (?, ?, ?, ?, ?)",
        cycle.id,
        cycle.startDate,
        cycle.periodEndDate,
        cycle.notes ?? null,
        cycle.predictedStartDate ?? null,
      );
    }
    for (const log of logs) {
      await db.runAsync(
        "INSERT INTO daily_logs (date, flow, mood, symptoms, notes, temperature_c) VALUES (?, ?, ?, ?, ?, ?)",
        log.date,
        log.flow,
        log.mood,
        JSON.stringify(log.symptoms),
        log.notes,
        log.temperatureC,
      );
    }
  });
}

/** Ayarlar ekranındaki "Tüm verileri sil". Ayarlar (tema, onay) korunur. */
export async function deleteAllRecords(): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM cycles");
    await db.runAsync("DELETE FROM daily_logs");
  });
}

// ---------------------------------------------------------------------------
// Ayarlar (anahtar-değer)
// ---------------------------------------------------------------------------

/** Açılışta tek seferlik okunur; senkron, çünkü tema ilk karede lazım. */
export function readSettingsSync(): Record<string, string> {
  const rows = db.getAllSync<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function writeSettingSync(key: string, value: string | null): void {
  if (value === null) db.runSync("DELETE FROM settings WHERE key = ?", key);
  else
    db.runSync(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      key,
      value,
    );
}
