# Panduan Build APK Android dengan Capacitor di GitHub Actions

File otomasi GitHub Actions telah dikonfigurasi pada [.github/workflows/build-apk.yml](file:///.github/workflows/build-apk.yml).

## Langkah 1: Push Perubahan ke GitHub
Jalankan perintah git berikut di terminal proyek Anda untuk mengirimkan kode terbaru ke repository GitHub:

```bash
git add .
git commit -m "build: update Capacitor and live tv proxy features"
git push origin main
```

> **Catatan**: Jika branch utama Anda bernama `master`, gunakan `git push origin master`.

---

## Langkah 2: Menjalankan Build di GitHub Web UI (Manual Trigger)
Jika Anda ingin memicu proses build secara manual tanpa push baru:

1. Buka repository **MyStreamFlix** di browser GitHub Anda.
2. Klik tab **Actions** pada bagian navigasi atas repository.
3. Di panel sebelah kiri (Workflows), klik **Build Android APK with Capacitor**.
4. Klik tombol dropdown **Run workflow** di sebelah kanan.
5. Klik tombol **Run workflow** berwarna hijau.

---

## Langkah 3: Mendownload File APK yang Dihasilkan
1. Tunggu proses kompilasi selesai (sekitar 3 - 5 menit) hingga ikon centang hijau muncul.
2. Klik pada hasil eksekusi workflow tersebut.
3. Gulir ke bagian paling bawah ke seksi **Artifacts**.
4. Klik pada nama artifact **`MyStreamFlix-Android-APK`** untuk mendownload file `.zip`.
5. Ekstrak file `.zip` tersebut untuk mendapatkan file **`app-debug.apk`** atau **`MyStreamFlix-1.0.0-debug.apk`**.
6. Transfer file `.apk` ke Smartphone Android Anda dan lakukan install.

---

## Spesifikasi Teknis Build
- **Java Version**: OpenJDK 21 (Temurin)
- **Node.js Version**: Node.js 22 LTS
- **Android Gradle Plugin**: Capacitor v8.5.0
- **Paket Output**: `android/app/build/outputs/apk/debug/app-debug.apk`
