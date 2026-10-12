# MyStreamFlix TV - Android TV Edition 📺

Edisi khusus **Android TV / Google TV** untuk **MyStreamFlix** dengan antarmuka 10-foot UI yang elegan, 100% identik dengan versi web/mobile, dan dioptimalkan secara penuh untuk navigasi remote control (**D-Pad / Directional Pad**).

---

## 🌟 Fitur Utama Android TV

1. **100% Identik UI, Layout & Animasi:**
   - Desain dark mode premium glassmorphism dengan aksen cyan khas MyStreamFlix.
   - Hero Banner 16:9 cinematic dengan badge resolusi 4K Ultra HD & HDR10+.
   - Content Rails horizontal (*Sedang Tren*, *Film Bioskop*, *Serial TV*, *Live TV*).
2. **Navigasi Remote TV (D-Pad Spatial Navigation):**
   - Mendukung penuh tombol remote TV: **Atas (▲), Bawah (▼), Kiri (◄), Kanan (►), OK / Select, dan Kembali (Back)**.
   - Efek fokus visual glowing cyan neon & pembesaran kartu (*scale 1.08x*) yang jelas dilihat dari jarak 3 meter di layar 40-75 inci.
   - Auto-scroll horizontal & vertikal mengikuti arah tombol remote.
3. **MPEG-DASH & HLS Full Support:**
   - Mesin pemutar bawaan **Dash.js** untuk siaran `.mpd` dan **Hls.js** untuk siaran `.m3u8`.
   - *Adaptive Quality Switcher* otomatis (Auto, 1080p, 720p, 480p, 360p).
   - Pemutar langsung (Direct Play) untuk video Cloudflare R2 Akun A & B tanpa jeda.
4. **Android TV Leanback Certification:**
   - Dilengkapi **Leanback Banner** resmi (16:9) agar ikon aplikasi tampil megah di menu utama Android TV / Google TV.
   - Deklarasi `android.hardware.touchscreen = false` sehingga kompatibel 100% dengan perangkat TV non-touchscreen.

---

## 📁 Struktur Direktori `tv/`

```text
tv/
├── package.json               # Konfigurasi & dependensi TV
├── capacitor.config.json      # Konfigurasi Capacitor Android TV
├── build-apk.ps1              # Script otomatis kompilasi APK via PowerShell
├── README.md                  # Dokumentasi panduan ini
├── dist/                      # Web client TV 10-foot UI
│   ├── index.html             # Tampilan utama & player TV
│   ├── tv-spatial-nav.js      # Mesin navigasi D-Pad remote control
│   ├── tv-styles.css          # Styling overscan TV & focus glow
│   └── assets/                # Banner TV 16:9 & icon aplikasi
└── android/                   # Proyek Android TV Native
    ├── build.gradle           # Konfigurasi root Gradle
    ├── settings.gradle
    └── app/
        ├── build.gradle       # Konfigurasi target SDK 34 & Leanback
        └── src/main/
            ├── AndroidManifest.xml   # LEANBACK_LAUNCHER & Banner TV
            ├── java/.../MainActivity.java # Intersepsi hardware remote D-pad
            └── res/drawable/tv_banner.png # Banner launcher Android TV
```

---

## 🚀 Cara Build APK Android TV

### Metode 1: Menggunakan Android Studio (Paling Mudah)
1. Buka software **Android Studio**.
2. Pilih menu **File** -> **Open...**
3. Arahkan ke folder:
   ```text
   c:\Users\Gugah Nugraha\OneDrive\Documents\Dev\MyStreamFlix\tv\android
   ```
4. Tunggu proses *Gradle Sync* selesai beberapa saat.
5. Klik menu atas **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
6. File APK yang sudah jadi akan tersedia di:
   ```text
   tv/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Metode 2: Menggunakan Terminal / PowerShell
Cukup jalankan script builder dari folder `tv/`:
```powershell
cd tv
powershell -ExecutionPolicy Bypass -File ./build-apk.ps1
```

---

## 📲 Cara Install APK ke Android TV / Google TV

### Cara A: Melalui ADB Tanpa Kabel (Wireless Debugging)
1. Di Android TV, buka **Settings** -> **Device Preferences** -> **About**.
2. Klik **Build** sebanyak 7 kali hingga muncul pesan *"You are now a developer"*.
3. Buka **Developer Options** -> aktifkan **Network Debugging / USB Debugging**.
4. Catat alamat IP TV Anda (misal: `192.168.1.50`).
5. Dari laptop / komputer Anda, jalankan perintah:
   ```bash
   adb connect 192.168.1.50:5555
   adb install -r "tv/android/app/build/outputs/apk/debug/app-debug.apk"
   ```

### Cara B: Melalui Flashdisk (USB Drive)
1. Salin file `app-debug.apk` ke dalam Flashdisk.
2. Tancapkan Flashdisk ke port USB di Android TV / Smart TV.
3. Buka aplikasi File Manager di TV (seperti *X-plore File Manager* atau *File Commander* dari Play Store TV).
4. Klik file `app-debug.apk` dan pilih **Install**.
5. Buka **MyStreamFlix TV** langsung dari launcher Android TV Anda!
