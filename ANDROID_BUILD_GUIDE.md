# Panduan Pembuatan APK Android via GitHub Actions & Capacitor

Dengan **GitHub Actions**, Anda **tidak perlu meng-install Android Studio atau Java** di laptop/komputer Anda! GitHub akan secara otomatis mengkompilasi file **APK** setiap kali Anda melakukan `push` kode ke GitHub.

---

## ⚡️ Cara Kerja Otomatis di GitHub Actions

Workflow GitHub Actions sudah disiapkan di file [`.github/workflows/build-apk.yml`](file:///.github/workflows/build-apk.yml).

Setiap kali Anda menekan **Push** ke cabang `main` atau `master`:
1. GitHub Actions akan otomatis aktif.
2. Memasang Java 21 & Android SDK di cloud server GitHub.
3. Menjalankan `npm install` & `npx cap sync android`.
4. Mengompilasi project Android dengan Gradle menjadi file **`app-debug.apk`**.
5. Mengunggah file APK ke tab **Actions** di repository GitHub Anda sehingga bisa langsung di-download!

---

## 🚀 3 Langkah Mudah Menggunakan GitHub Actions

### Langkah 1: Push Kode ke Repository GitHub Anda
Gunakan Git Desktop, VS Code Git UI, atau terminal untuk melakukan commit & push:
```bash
git add .
git commit -m "Update konfigurasi Capacitor dan GitHub Workflow"
git push origin main
```

---

### Langkah 2: Lihat Proses Build di GitHub
1. Buka repository **MyStreamFlix** Anda di GitHub browser (`https://github.com/USERNAME/MyStreamFlix`).
2. Klik tab **Actions** di bagian atas menu GitHub.
3. Anda akan melihat workflow bernama **`Build Android APK with Capacitor`** sedang berjalan (berwarna kuning 🟡 lalu berubah hijau 🟢 saat selesai).

---

### Langkah 3: Download File APK
1. Klik pada nama workflow yang telah selesai (bercentang hijau 🟢).
2. Gulir ke bagian paling bawah ke bagian **Artifacts**.
3. Klik file **`MyStreamFlix-Android-APK`** untuk mendownload file `.zip` yang berisi **`app-debug.apk`**.
4. Ekstrak `.zip` tersebut dan install `.apk` ke HP Android Anda! 📱🎉

---

## ⚙️ Mengubah Server URL Aplikasi (Opsional)

Jika Anda mengganti domain Vercel / server hosting Anda, cukup ubah file [`capacitor.config.ts`](file:///capacitor.config.ts):

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mystreamflix.app',
  appName: 'MyStreamFlix',
  webDir: 'public',
  server: {
    url: 'https://domain-anda.com', // Ubah ke URL Web App Anda
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#09090b'
  }
};

export default config;
```

Setelah di-save dan di-push ke GitHub, APK baru akan otomatis di-build dengan URL terbaru tersebut!
