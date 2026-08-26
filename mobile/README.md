# 📱 MyStreamFlix — React Native Android App (ExoPlayer Engine)

Aplikasi mobile native murni berbasis **React Native** yang ditenagai oleh **Google ExoPlayer** (`react-native-video`) untuk performa streaming terbaik, hardware acceleration, dan dukungan format video terlengkap.

---

## 🎬 Fitur Utama Native ExoPlayer

1. **Format Video & Streaming Universal**:
   - ⚡ **HLS (.m3u8)** & Live TV IPTV
   - ⚡ **MPEG-DASH (.mpd)**
   - ⚡ **Matroska (.mkv)**
   - ⚡ **MP4, WebM, TS**
   - ⚡ **Google Drive Video Streaming** (otomatis dialihkan via proxy backend tanpa batasan file size 100MB)
2. **Gesture Controls Asli Android**:
   - **Double-Tap Kiri/Kanan**: Mundur / Maju 10 detik (`-10s` / `+10s`).
   - **Vertical Swipe Sisi Kiri**: Mengatur tingkat kecerahan layar (*Brightness*).
   - **Vertical Swipe Sisi Kanan**: Mengatur volume suara (*Volume*).
3. **Aspect Ratio Switcher**:
   - `CONTAIN`: Rasio asli (16:9).
   - `COVER`: Zoom / Crop untuk memenuhi layar HP panjang (19.5:9 / 20:9) **tanpa black bar**.
   - `STRETCH`: Full screen stretch.
4. **Touch Lock Mode**:
   - Mengunci layar dari sentuhan tidak sengaja saat menonton.
5. **Subtitles & Multi-Audio**:
   - Bottom sheet picker subtitle (.vtt / .srt) dan pemilihan trek audio.
6. **TV Series Episode Drawer**:
   - Memilih musim dan episode langsung di dalam pemutar video.

---

## 🚀 Cara Menjalankan & Build

### 1. Masuk ke folder `mobile/` & Install Dependencies:
```bash
cd mobile
npm install
```

### 2. Jalankan Metro Bundler:
```bash
npm start
```

### 3. Jalankan di Emulator / Device Android:
```bash
npm run android
```

### 4. Build APK Release (Standalone APK):
```bash
cd android
./gradlew assembleRelease
```
File APK siap instal akan berada di:
`mobile/android/app/build/outputs/apk/release/app-release.apk`
