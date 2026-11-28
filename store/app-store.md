# App Store bilgileri (iOS)

App Store Connect'e elle girilecek metinler ve formlar. Açıklama metni Google
Play ile aynı (`listing.md` → "Tam açıklama"); burada yalnızca App Store'a
özgü alanlar var.

Görseller:
- Uygulama simgesi: `assets/icon.png` (1024×1024, derlemeden otomatik gelir)
- Ekran görüntüleri: 6.9" iPhone (1320×2868 ya da 1290×2796), en az 1, en
  çok 10. Gerçek iPhone'da TestFlight derlemesinden alınacak.
- iPad desteği kapalı (`supportsTablet: false`) → iPad görüntüsü gerekmez.

---

## Türkçe (tr)

| Alan | Sınır | Değer |
|---|---|---|
| Ad | 30 | `Döngüm: Adet Takvimi` |
| Alt başlık | 30 | `Adet takvimi, telefonunda` |
| Anahtar kelimeler | 100 | `regl,adet,döngü,takip,ovülasyon,doğurganlık,yumurtlama,kadın,sağlık,hatırlatma,takvim` |
| Tanıtım metni | 170 | `Adetini, doğurgan pencereni ve belirtilerini takip et. Hesap yok; kayıtların yalnızca telefonunda kalır.` |

## English (en-US)

| Field | Limit | Value |
|---|---|---|
| Name | 30 | `Döngüm: Period Tracker` |
| Subtitle | 30 | `Private period tracker` |
| Keywords | 100 | `period,cycle,menstrual,ovulation,fertility,calendar,pms,women,health,reminder,tracker,private` |
| Promotional text | 170 | `Track your period, fertile window and symptoms. No account needed; your entries stay on your phone.` |

---

## Genel ayarlar

| Alan | Değer |
|---|---|
| Birincil kategori | Sağlık ve Fitness (Health & Fitness) |
| İkincil kategori | Tıp (Medical) — isteğe bağlı |
| Fiyat | Ücretsiz |
| Uygulama içi satın alma | Yok |
| Gizlilik politikası URL'si | https://oguzalpkocagoz.github.io/Menstrual_Tracking/privacy.html |
| Destek URL'si | Aynı adres ya da `mailto:` yerine bir web sayfası (Apple web adresi ister) |
| Telif hakkı | `2026 Oğuzalp Kocagöz` |

### Yaş derecelendirmesi anketi

- Tıbbi/Tedavi bilgisi: **Seyrek/Hafif** (döngü ve doğurganlık bilgisi)
- Diğer bütün içerik türleri (şiddet, cinsellik, kumar, vb.): **Yok**
- Sınırsız web erişimi: **Hayır**
- Beklenen sonuç: 12+ civarı.

### İhracat uyumluluğu (şifreleme)

`ITSAppUsesNonExemptEncryption = false` app.json'da ayarlı; App Store Connect
her yüklemede sormaz.

---

## App Privacy ("Gizlilik etiketleri")

Apple'ın tanımında "toplanan veri" = cihazdan dışarı gönderilen veri. Döngü,
belirti, not, sıcaklık kayıtları telefondan çıkmaz → **beyan edilmez**.
Beyan edilecekler yalnızca reklam SDK'sının (Google AdMob) verileri:

| Veri türü | Kullanım amacı | Kullanıcıya bağlı mı | Takip için mi |
|---|---|---|---|
| Tanımlayıcılar › Cihaz kimliği (IDFA) | Üçüncü taraf reklam | Hayır | **Evet** (yalnızca ATT izni verilirse) |
| Kullanım verileri › Reklam verileri | Üçüncü taraf reklam, Analiz | Hayır | Evet |
| Kullanım verileri › Ürün etkileşimi | Analiz | Hayır | Hayır |
| Konum › Yaklaşık konum | Üçüncü taraf reklam | Hayır | Hayır |
| Tanılama › Kilitlenme / Performans verileri | Analiz | Hayır | Hayır |

> Bu tablo Google'ın "AdMob için App Store veri açıklaması" sayfası esas
> alınarak hazırlandı; göndermeden önce o sayfanın güncel hâliyle
> karşılaştırılmalı. Hesap/partner özelliği gelince güncellenmeli.

**"Sağlık ve Fitness"** veri türünü işaretleme: veriler cihazdan çıkmıyor.

---

## Derleme (Apple hesabı onaylandıktan sonra)

```
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

İlk derlemede EAS, Apple hesabına giriş isteyip sertifika ve profilleri
kendisi oluşturur; Mac gerekmez. Yüklenen derleme TestFlight'a düşer,
iPhone'a TestFlight uygulamasıyla kurulur.
