# Panduan Build APK Android (React Native + ExoPlayer & Capacitor)

Proyek ini memiliki dua versi build Android:
1. **React Native (ExoPlayer + Safe Area Layout)** - *Versi Baru Native (Direkomendasikan)*
2. **Capacitor (WebView Wrapper)** - *Versi Web Legacy*

---

## 🚀 Cara Build APK React Native + ExoPlayer

### Metode 1: Build Otomatis via GitHub Actions (Rekomendasi)
Workflow otomatisation telah dibuat pada [.github/workflows/build-react-native-apk.yml](file:///.github/workflows/build-react-native-apk.yml).

1. Push kode terbaru ke repository GitHub:
   ```bash
   git add .
   git commit -m "build: update React Native ExoPlayer mobile app"
   git push origin main
   ```
2. Buka tab **Actions** di repository GitHub Anda.
3. Pilih workflow **"Build React Native Android APK"**.
4. Klik **Run workflow** -> **Run workflow**.
5. Tunggu build selesai, lalu download artifact **`MyStreamFlix-ReactNative-ExoPlayer-APK`**.

---

### Metode 2: Build Lokal di PC Anda

1. Masuk ke folder `mobile`:
   ```bash
   cd mobile
   npm install
   ```
2. Generate folder Android native (Expo Prebuild):
   ```bash
   npx expo prebuild --platform android
   ```
3. Kompilasi file APK menggunakan Gradle:
   ```bash
   cd android
   .\gradlew assembleDebug
   ```
4. File APK siap pakai akan berada di lokasi:
   `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

### Metode 3: Build Cloud via EAS (Expo Application Services)
File konfigurasi telah disiapkan pada [`mobile/eas.json`](file:///c:/Users/hp/Documents/Dev/MyStreamFlix/mobile/eas.json).

```bash
cd mobile
npm install -g eas-cli
eas build -p android --profile preview
```

---

## Spesifikasi Teknis React Native Build
- **Framework**: React Native 0.76 + Expo SDK 52
- **Video Engine**: ExoPlayer (`react-native-video` v6)
- **Safe Area**: `react-native-safe-area-context` v4
- **Java**: OpenJDK 21 (Temurin)
- **Output Artifact**: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
