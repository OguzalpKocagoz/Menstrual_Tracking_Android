# Google Play mağaza bilgileri

Bu dosya Play Console'a elle girilecek metinleri ve formların nasıl
doldurulacağını tutar. Görseller bu klasörde:

- `play-icon-512.png` — Uygulama simgesi (512×512)
- `feature-graphic.png` — Öne çıkan grafik (1024×500)
- Ekran görüntüleri: gerçek telefonda alınacak (en az 2, önerilen 4–8;
  Bugün, Takvim, Doğurganlık, Ayarlar/temalar).

---

## Türkçe (tr-TR) — varsayılan dil

**Uygulama adı** (en çok 30 karakter)

```
Döngüm: Adet Takvimi
```

**Kısa açıklama** (en çok 80 karakter)

```
Adet döngünü takip et, sıradaki dönemini önceden gör. Kayıtların telefonunda.
```

**Tam açıklama** (en çok 4000 karakter)

```
Döngüm, adet döngünü sade ve şık bir gece gökyüzü tasarımıyla takip etmeni sağlar.

KAYITLARIN SENDE
Hesap açman gerekmez. Adet, belirti, ruh hâli ve notların yalnızca telefonunda saklanır; hiçbir sunucuya gönderilmez. İstersen uygulamayı telefonunun kilidiyle (parmak izi, yüz ya da PIN) koruyabilirsin.

NELER YAPABİLİRSİN
• Adetinin başladığı ve bittiği günü tek dokunuşla işaretle
• Sıradaki adetini, doğurgan pencereni ve tahmini yumurtlama gününü gör
• Takvimde geçmiş ve tahmini günleri renklerle izle
• Kanama yoğunluğu, belirtiler, ruh hâli, bazal sıcaklık ve not ekle
• Döngü uzunluğu, düzenlilik ve geçmiş istatistiklerini incele
• Adetinden önce ve doğurgan dönem başlarken, istediğin saatte hatırlatma al
• Günlük hap hatırlatması kur
• Hatırlatmalar kilit ekranında bile gizli kalsın diye nötr metinlerle gelir
• Gül, Lavanta, Okyanus, Orman ve Aurora temaları; her temanın kendi kayan şekilleri
• Türkçe ve İngilizce

ÖNEMLİ
Döngüm yalnızca kişisel takip amaçlıdır; tıbbi tavsiye, teşhis veya tedavinin yerine geçmez. Tahminler yaklaşıktır ve doğum kontrolü yöntemi olarak kullanılamaz. Sağlığınla ilgili kararlar için bir doktora danış.
```

---

## English (en-US)

**App name**

```
Döngüm: Period Tracker
```

**Short description**

```
Track your cycle and see your next period coming. Your data stays on your phone.
```

**Full description**

```
Döngüm helps you track your menstrual cycle with a calm, beautiful night-sky design.

YOUR DATA STAYS WITH YOU
No account needed. Your periods, symptoms, moods and notes are stored only on your phone and never sent to a server. You can protect the app with your phone's lock (fingerprint, face or PIN).

WHAT YOU CAN DO
• Mark the start and end of your period with one tap
• See your next period, fertile window and predicted ovulation
• Follow past and predicted days on a color-coded calendar
• Log flow, symptoms, mood, basal temperature and notes
• Explore cycle length, regularity and history
• Get reminders before your period and when your fertile window starts, at the time you choose
• Set a daily pill reminder
• Reminders use neutral wording so nothing personal shows on your lock screen
• Rose, Lavender, Ocean, Forest and Aurora themes, each with its own drifting shapes
• English and Turkish

IMPORTANT
Döngüm is for personal tracking only and is not a substitute for medical advice, diagnosis or treatment. Predictions are estimates and must not be used as a method of birth control. Talk to a doctor about decisions regarding your health.
```

---

## Mağaza ayarları

| Alan | Değer |
|---|---|
| Uygulama mı oyun mu | Uygulama |
| Kategori | Sağlık ve Fitness (Health & Fitness) |
| Ücretli / ücretsiz | Ücretsiz (uygulama içi satın alma yok) |
| Reklam içeriyor mu | **Evet** |
| İletişim e-postası | kocagozoguzalp@gmail.com |
| Gizlilik politikası URL'si | `docs/privacy.html` yayınlandığı adres |

---

## Uygulama içeriği formları

### Veri güvenliği (Data safety)

Play'in tanımında "toplanan veri" = cihazdan **dışarı gönderilen** veri.
Döngü/sağlık kayıtları telefondan çıkmadığı için **toplanmıyor**. Toplananlar
yalnızca reklam SDK'sının (AdMob) verileri:

| Soru | Cevap |
|---|---|
| Uygulama kullanıcı verisi topluyor ya da paylaşıyor mu? | Evet (AdMob nedeniyle) |
| Aktarılan veriler şifreleniyor mu? | Evet (AdMob HTTPS kullanır) |
| Kullanıcı verilerinin silinmesini isteyebilir mi? | Evet — uygulama içinden "Tüm kayıtları sil"; uygulamayı kaldırmak da siler |

Beyan edilecek veri türleri (hepsi: **toplanıyor + paylaşılıyor**, amaç
**Reklam veya pazarlama**, ayrıca **Analiz** ve **Dolandırıcılığı önleme**;
toplama **zorunlu değil**: kullanıcı rızaya göre sınırlı reklam alır):

- **Cihaz veya diğer kimlikler** — Reklam kimliği
- **Konum > Yaklaşık konum** — IP adresinden çıkarım
- **Uygulama etkinliği > Uygulama etkileşimleri** — reklam etkileşimleri
- **Uygulama bilgileri ve performansı > Kilitlenme günlükleri / Tanılama** — SDK

**Sağlık ve fitness** kategorisini işaretleme: bu veriler cihazdan çıkmıyor.
(Hesap/partner özelliği gelince bu form güncellenmeli.)

> AdMob'un güncel beyan listesi: Google'ın "Google Play Veri güvenliği
> formu için AdMob" yardım sayfasıyla karşılaştırılmalı; yukarıdaki liste
> o sayfa esas alınarak hazırlandı, gönderimden önce kontrol edilmeli.

### Diğer formlar

| Form | Cevap |
|---|---|
| Reklamlar | Evet, uygulamada reklam var |
| Uygulama erişimi | Tüm işlevler kısıtlama olmadan kullanılabilir (giriş yok) |
| İçerik derecelendirmesi | Anketi doldur: şiddet/cinsellik/kumar yok; kullanıcılar arası iletişim yok |
| Hedef kitle | 13+ (çocuklara yönelik değil). "18 yaş altı" gruplarını seçme |
| Sağlık uygulamaları beyanı | "Adet/döngü takibi" (menstrual tracking); tıbbi cihaz değil |
| Haber uygulaması | Hayır |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Yok |
