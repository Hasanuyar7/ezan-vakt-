# 🌙 Ezan Sustur

Ezan vakti geldiğinde açık sekmelerdeki müzik ve videoları otomatik duraklatan, isteğe bağlı olarak belirli süre sonra devam ettiren **Manifest V3** Chrome uzantısı.

<p align="center">
  <img src="icons/icon128.png" width="96" alt="Ezan Sustur ikonu">
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-0e2528?style=flat-square">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-Uzantı-f0c674?style=flat-square">
  <img alt="Lisans" src="https://img.shields.io/badge/Lisans-MIT-88a9a5?style=flat-square">
  <img alt="Dil" src="https://img.shields.io/badge/Dil-Türkçe-e9f1ee?style=flat-square">
</p>

---

## ✨ Özellikler

- 🕌 **Ezan vaktinde otomatik susturma** — Açık sekmelerde çalan müzik/videoyu vakit girdiğinde otomatik duraklatır.
- 🕰️ **5 vakit desteği** — Sabah, Öğle, İkindi, Akşam, Yatsı.
- 🎚️ **Vakit bazlı kontrol** — Her vakit için ayrı aç/kapat anahtarı.
- 🌍 **Şehir / ülke seçimi** — [Aladhan API](https://aladhan.com/prayer-times-api) üzerinden vakitleri çeker; varsayılan: **İstanbul / Türkiye**, Diyanet metodu (`method=13`).
- 🔁 **İsteğe bağlı devam ettirme** — Ezan bitince veya belirlenen süre sonunda yalnızca uzantının duraklattığı medyayı yeniden başlatır.
- ⏱️ **Ayarlanabilir bekleme süresi** — 1–30 dakika arası.
- 🧠 **Akıllı davranış** — Kullanıcının kendi durdurduğu videoya dokunmaz; yalnızca kendi duraklattığını devam ettirir.
- 🖥️ **Tüm sekmelerde çalışma** — Erişilebilen tüm HTTP/HTTPS sekmelerinde ve frame’lerde çalışır.
- 🧪 **Test butonları** — “Şimdi duraklat” ve “Devam ettir” ile anında deneme.
- 🔘 **Tek anahtarla aç/kapat** — Tüm uzantı tek switch ile devre dışı bırakılabilir.
- 🌙 **Gökyüzü / yay animasyonu** — Canvas ile çizilen yay üzerinde güneş/ay konumu ve vakit noktaları.
- ⏳ **Geri sayım** — Bir sonraki vakte kalan süre canlı olarak gösterilir.
- 📋 **Vakit listesi** — Geçmiş ve sıradaki vakit görsel olarak vurgulanır.
- 🇹🇷 **Türkçe arayüz**
- 💾 **Ayarlar senkronize** — `chrome.storage.sync` ile Chrome hesabına bağlı senkronizasyon.
- ⚙️ **Manifest V3** — Modern Chrome uzantı mimarisi.
- 🔄 **Otomatik yenileme** — Vakitler 6 saatte bir güncellenir.
- 🚫 **Erişilemeyen sekmeleri atlar** — `chrome://` gibi özel sayfalarda hata vermez.

---

## 🛠️ Teknik Özellikler

| Bileşen | Açıklama |
|---|---|
| **Manifest** | Manifest V3 |
| **Arka plan** | Service worker (`background.js`) |
| **Zamanlama** | `chrome.alarms` |
| **Depolama** | `chrome.storage.sync` + `chrome.storage.local` |
| **Sekme kontrolü** | `chrome.scripting` + `chrome.tabs` |
| **Vakit verisi** | Aladhan API (`timingsByCity`) |
| **Animasyon** | HTML5 Canvas |
| **Arayüz** | Vanilla HTML / CSS / JS |

---

## 📦 Kurulum

### Chrome Web Store
> Yakında.

### Geliştirici Modu (Manuel Kurulum)

1. Bu repoyu indir:
   ```bash
   git clone https://github.com/kullanici/ezan-sustur.git
 `
   ezan-sustur/
├── background.js      # Service worker, alarm yönetimi, medya kontrolü
├── manifest.json      # Manifest V3 tanımı
├── popup.html         # Popup arayüzü
├── popup.css          # Popup stilleri
├── popup.js           # Popup mantığı + canvas yay animasyonu
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── fonts/
    ├── bricolage-latin.woff2
    └── bricolage-latin-ext.woff2

    📄 Lisans
MIT © 2026

🙏 Teşekkürler
Aladhan API — Vakit verisi

Bricolage Grotesque — Yazı tipi

 `
`kullanici` kısmını kendi GitHub kullanıcı adınla, lisans yılını da istediğin yılla değiştirmeyi unutma.
   
