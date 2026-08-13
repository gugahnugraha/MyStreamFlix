# Panduan Build APK Android (Capacitor + Native ExoPlayer Engine)

File otomasi GitHub Actions telah dikonfigurasi pada [.github/workflows/build-apk.yml](file:///.github/workflows/build-apk.yml).

Proyek ini menggunakan **Next.js 15** dengan plugin native **ExoPlayer** (`capacitor-video-player`) untuk pemutaran video HLS, DASH, MP4, dan Live TV secara native di Android.

---

## 🚀 Langkah Build APK via GitHub Actions (Otomatis)

1. Push perubahan terbaru ke repository GitHub:
   ```bash
   git add .
   git commit -m "build: update Capacitor Android with native ExoPlayer engine"
   git push origin main
   ```

2. Menjalankan Build di GitHub Web UI (Manual Trigger):
   - Buka repository **MyStreamFlix** di browser GitHub Anda.
   - Klik tab **Actions** pada bagian navigasi atas repository.
   - Di panel sebelah kiri, klik **Build Android APK with Capacitor**.
   - Klik tombol dropdown **Run workflow** -> **Run workflow**.

3. Mendownload File APK:
   - Tunggu proses kompilasi selesai (sekitar 3 - 5 menit).
   - Klik pada hasil eksekusi workflow tersebut.
   - Gulir ke bagian bawah ke seksi **Artifacts**.
   - Download artifact **`MyStreamFlix-Android-APK`**.

---

## Spesifikasi Teknis Build
- **Framework**: Next.js 15 App Router + Capacitor v8
- **Native Video Engine**: ExoPlayer Android (`capacitor-video-player` v6)
- **Java Version**: OpenJDK 21 (Temurin)
- **Node.js Version**: Node.js 22 LTS
- **Paket Output**: `android/app/build/outputs/apk/debug/app-debug.apk`
