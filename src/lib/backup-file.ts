import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { backupFileName, createBackup, parseBackup, type BackupData } from "./backup";
import { getToday } from "./today";

/**
 * Yedek dosyasını yazma, paylaşma ve seçme (telefona bağlı kısım).
 *
 * Dosya uygulamanın geçici klasörüne yazılır ve Android'in paylaşma
 * penceresiyle kullanıcıya verilir; nereye kaydedileceğini (Drive, WhatsApp,
 * e-posta, Dosyalar) kullanıcı seçer. Uygulama dosyayı hiçbir yere kendisi
 * göndermez.
 */

/** Paylaşma penceresini açar. Kullanıcı vazgeçerse sessizce biter. */
export async function shareBackup(data: BackupData, dialogTitle: string): Promise<void> {
  const file = new File(Paths.cache, backupFileName(getToday()));
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(createBackup(data, new Date()), null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle });
}

/**
 * Dosya seçiciyi açar ve seçilen yedeği doğrular. Vazgeçilirse null;
 * dosya geçersizse `UserError("invalidBackup")`.
 */
export async function pickBackup(): Promise<BackupData | null> {
  // Bazı dosya yöneticileri .json'u "application/octet-stream" ya da düz metin
  // olarak bildiriyor; tür filtresi dar tutulursa kullanıcı dosyasını seçemez.
  // Asıl kontrol içerikte (`parseBackup`).
  const picked = await File.pickFileAsync({ mimeTypes: ["application/json", "text/*", "application/octet-stream"] });
  if (picked.canceled) return null;
  return parseBackup(await picked.result.text());
}
