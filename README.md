# Döngüm — Android

Adet döngüsü takip uygulaması (Expo SDK 58 + expo-router).

Hesap ve sunucu yoktur: bütün kayıtlar telefonda, SQLite'ta (`expo-sqlite`)
tutulur ve hiçbir yere gönderilmez. İlk açılışta tıbbi uyarı onaylatılır.

## Yapı

```
app/              ekranlar (expo-router)
  (tabs)/         Bugün · Takvim · Doğurganlık · İstatistik
  hosgeldin.tsx   ilk açılış: tıbbi uyarı onayı
  gun/[date].tsx  gün detayı
  ayarlar.tsx     tema, varsayılan uzunluklar, tüm kayıtları sil
src/core/         packages/core'un BİREBİR kopyası (tahmin ve istatistik
                  hesapları) — burada değiştirme, önce web reposunda değiştir
src/lib/
  db.ts           SQLite: şema sürümleri, döngü/günlük/ayar okuma-yazma
  rules.ts        yazmadan önce uygulanan kurallar (saf, test edilir)
  settings.tsx    tema, uzunluklar, uyarı onayı
```

Şema değişikliği gerekirse `db.ts` içindeki `MIGRATIONS` listesinin sonuna
yeni bir adım ekle; var olan adımları değiştirme — telefonlarda çalışmış olabilir.

## Çalıştırma

```bash
npm install
npx expo start
```

## Test

```bash
npm test          # core (73 test) + veri kuralları
npm run typecheck
npx expo lint
```

## Android derlemesi

Yerel derleme proje yolunda ASCII dışı karakter (ör. `İ`) olduğunda başarısız
olur (Gradle/CMake). Yerelde derleyeceksen projeyi ASCII bir yola koy; EAS
bulutta derlediği için etkilenmez.

1. `app.json` → `android.package`: benzersiz bir ad (`com.<ad>.dongum`).
   Bir kez yayınlandıktan sonra değiştirilemez.
2. `npx eas-cli login` ve `npm run build:android`. İmzalama anahtarını EAS
   üretsin ve saklasın — kaybolursa güncelleme yayınlanamaz.
3. Play Console: Data Safety formunda veri toplanmadığını beyan et (reklam
   eklenirse reklam kimliğini beyan et). Gizlilik politikası URL'si zorunlu.

## Cihazda ilk açılışta denetle

- Ayarlar ekranının altında "saat dilimi verisi bulunamadı" notu görünüyorsa
  Hermes derlemesinde `Intl` saat dilimi desteği yok demektir; uygulama sabit
  UTC+3'e düşer (yalnızca Türkiye için doğru).
