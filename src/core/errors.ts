/**
 * Kullanıcıya gösterilmesi amaçlanan hatalar.
 *
 * Ayrım şunun için var: bir eylem `catch` bloğunda yakaladığı her hatanın
 * metnini ekrana basarsa, beklenmeyen bir arıza da olduğu gibi dışarı çıkar
 * (ör. dosya yolu içeren bir SQLite hatası).
 *
 * Kural basit: kullanıcının okuması *istenen* her hata `UserError` olarak
 * fırlatılır. Geri kalan her şey beklenmeyen sayılır ve kullanıcıya genel bir
 * mesaj döner.
 *
 * Hata metin değil kod taşır: çekirdek dilden bağımsızdır, metin ekranda
 * seçili dile göre üretilir (`describeError`).
 */
export type UserErrorCode =
  | "cycleNotFound"
  | "noCycleToEnd"
  | "futureStart"
  | "endBeforeStart"
  | "periodTooLong"
  | "invalidFlow"
  | "invalidMood"
  | "temperatureRange"
  | "lengthRange";

export interface UserErrorParams {
  min?: number;
  max?: number;
  field?: "cycleLength" | "periodLength";
}

export class UserError extends Error {
  readonly code: UserErrorCode;
  readonly params: UserErrorParams;

  constructor(code: UserErrorCode, params: UserErrorParams = {}) {
    // Mesaj olarak kodun kendisi: günlüklerde ve testlerde okunur kalır.
    super(code);
    this.name = "UserError";
    this.code = code;
    this.params = params;
  }
}

export function isUserError(error: unknown): error is UserError {
  // `instanceof` yerine ad kontrolü: paket sınırları arasında sınıfın iki ayrı
  // kopyası yüklenebiliyor ve o durumda `instanceof` sessizce false döner.
  return error instanceof Error && error.name === "UserError";
}
