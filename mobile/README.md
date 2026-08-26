# 📱 MyStreamFlix Mobile (Expo Go & React Native)

Aplikasi mobile streaming film, serial TV, dan Live TV IPTV ditenagai oleh **Google ExoPlayer** (`expo-av`) yang 100% siap dijalankan langsung di HP Android Anda menggunakan **Expo Go**!

---

## ⚡ Cara Menjalankan Menggunakan Expo Go (Sangat Cepat & Mudah)

### 1. Install Expo Go di HP Android:
- Buka **Google Play Store** di HP Android Anda.
- Cari dan unduh aplikasi: **`Expo Go`**.

### 2. Jalankan Project di Laptop / PC:
Buka Terminal / PowerShell di folder `mobile`:
```bash
cd mobile
npm install
npx expo start
```

### 3. Scan QR Code:
- Setelah perintah di atas dijalankan, akan muncul **QR Code** di terminal.
- Buka aplikasi **Expo Go** di HP Android Anda ➔ Pilih **Scan QR code**.
- Aplikasi MyStreamFlix langsung terbuka di HP Anda secara live! ✨

---

## 🎬 Fitur Mesin ExoPlayer di Expo Go:

1. **Pemutaran Video Multi-Format**:
   - ⚡ **HLS (.m3u8)** & Live TV IPTV
   - ⚡ **MP4, Matroska (.mkv), WebM, TS**
   - ⚡ **Google Drive Direct Streaming**
2. **Gestur Sentuh Asli Android**:
   - **Double-Tap Sisi Kanan/Kiri**: Maju / Mundur 10 detik (`+10s` / `-10s`).
   - **Swipe Vertikal Sisi Kiri**: Mengatur tingkat Kecerahan Layar (*Brightness*).
   - **Swipe Vertikal Sisi Kanan**: Mengatur Volume Suara (*Volume*).
3. **Aspect Ratio Switcher**:
   - `CONTAIN`: Rasio asli (16:9).
   - `COVER`: Zoom / Crop memenuhi layar HP panjang (19.5:9 / 20:9) tanpa black bar.
   - `STRETCH`: Full screen stretch.
4. **Touch Lock**:
   - Mengunci layar dari sentuhan tidak sengaja saat menonton.
5. **Panel Subtitle & Episode TV Series**:
   - Memilih bahasa subtitle dan memilih episode serial TV langsung dari pemutar.
