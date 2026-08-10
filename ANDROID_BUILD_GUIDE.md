# Panduan Pembuatan APK Android (MyStreamFlix)

Panduan ini berisi langkah-langkah praktis dan mudah untuk mengubah project **MyStreamFlix** menjadi file **APK Android** menggunakan **Capacitor**.

---

## 📱 Ringkasan Arsitektur

Karena MyStreamFlix berbasis **Next.js** (dengan Database Prisma, API Route, Auth, & Streaming), terdapat **2 Metode** pembuatan APK:

1. **Metode 1: Online / Live Web App (Rekomendasi Utama)** ⭐️
   - Aplikasi Android membuka URL Web yang sudah di-deploy (misal ke Vercel atau Server milik Anda).
   - **Kelebihan**: Semua fitur backend (Database, Streaming, Payment, Auth) berjalan 100% normal tanpa kendala CORS / Prisma di HP.
2. **Metode 2: Offline / Static Export**
   - Web di-export menjadi file statis (`out/`) lalu dimasukkan ke dalam APK.
   - **Catatan**: API backend harus diarahkan ke URL server publik agar fitur login/database tetap bisa diakses.

---

## 🛠️ Persyaratan Utama (Prerequisites)

Sebelum melakukan build APK, pastikan perangkat Anda memiliki:
1. **Android Studio** (Sudah termasuk JDK & Android SDK)
   - Download di [developer.android.com/studio](https://developer.android.com/studio)
2. **Node.js** (Sudah terinstal di project ini).

---

## 🚀 Langkah Build APK via Android Studio (Paling Mudah)

### Langkah 1: Opsi Konfigurasi (`capacitor.config.ts`)

Buka file `capacitor.config.ts` di root project.

- **Jika Menggunakan Server Live (Vercel / Hosting Anda):**
  ```typescript
  import type { CapacitorConfig } from '@capacitor/cli';

  const config: CapacitorConfig = {
    appId: 'com.mystreamflix.app',
    appName: 'MyStreamFlix',
    webDir: 'out',
    server: {
      url: 'https://mystreamflix.vercel.app', // Ganti dengan URL Vercel/Server Anda
      cleartext: true
    }
  };

  export default config;
  ```

- **Jika Menggunakan Static Build / Offline:**
  1. Di file `next.config.ts`, tambahkan `output: 'export'`:
     ```typescript
     const nextConfig = {
       output: 'export',
       reactStrictMode: true,
     };
     ```
  2. Jalankan perintah di terminal:
     ```bash
     npm run build
     ```
  3. Sinkronkan ke folder Android:
     ```bash
     npm run cap:sync
     ```

---

### Langkah 2: Buka Project Android di Android Studio

Jalankan perintah ini di terminal project:
```bash
npm run cap:open
```
*Atau buka aplikasi **Android Studio** manual -> Pilihm `Open Project` -> Buka folder `c:\Users\hp\Documents\Dev\MyStreamFlix\android`.*

---

### Langkah 3: Generate File APK di Android Studio

1. Tunggu Android Studio selesai mendownload Gradle dependencies (terlihat status `Gradle Syncing...` di pojok bawah).
2. Di menu atas Android Studio, klik **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Tunggu hingga proses build selesai.
4. Ketika muncul notifikasi `"Build APK(s): APK(s) generated successfully"`, klik **locate**.
5. File `app-debug.apk` Anda siap diinstall ke smartphone Android! 📱🎉

---

## ⚡️ Alternatif: Build APK via Terminal / Command Line

Jika Anda memasang Java JDK (JDK 17/21) dan menambahkan `JAVA_HOME` ke Environment Variables Windows:

1. **Jalankan Build Gradle:**
   ```bash
   cd android
   .\gradlew.bat assembleDebug
   ```
2. **Lokasi File APK Hasil Build:**
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔒 Menghasilkan APK Production (Signed Release APK)

Untuk keperluan rilis ke Google Play Store atau distribusi resmi:
1. Di Android Studio, klik **Build** > **Generate Signed Bundle / APK...**
2. Pilih **APK** > **Next**.
3. Buat atau pilih **Key store path** (.jks file).
4. Pilih **release** build variant lalu klik **Create**.
