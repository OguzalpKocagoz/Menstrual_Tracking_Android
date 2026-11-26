/**
 * Kullanıcıya gösterilmesi amaçlanan hatalar.
 *
 * Ayrım şunun için var: bir eylem `catch` bloğunda yakaladığı her hatanın
 * metnini ekrana basarsa, beklenmeyen bir arıza da olduğu gibi dışarı çıkar.
 * Örneğin veritabanına ulaşılamadığında Mongoose'un ürettiği mesaj küme
 * adresini içerir (`querySrv ENOTFOUND _mongodb._tcp.<küme>.mongodb.net`) — ve
 * giriş sayfası kimlik doğrulaması istemediği için bunu herkes görebilirdi.
 *
 * Kural basit: kullanıcının okuması *istenen* her mesaj `UserError` olarak
 * fırlatılır. Geri kalan her şey beklenmeyen sayılır, günlüğe yazılır ve
 * kullanıcıya genel bir mesaj döner.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export function isUserError(error: unknown): error is UserError {
  // `instanceof` yerine ad kontrolü: paket sınırları arasında sınıfın iki ayrı
  // kopyası yüklenebiliyor ve o durumda `instanceof` sessizce false döner.
  return error instanceof Error && error.name === "UserError";
}
