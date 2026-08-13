# MyStreamFlix Mobile (React Native + ExoPlayer)

A native Android & iOS mobile application built with **React Native**, **ExoPlayer**, and **Safe Area Context**, connecting to the MyStreamFlix Next.js backend API.

## 🚀 Key Features

1. **Safe Area Layout Protection**:
   Uses `react-native-safe-area-context` (`SafeAreaProvider` & `SafeAreaView`) to prevent UI elements from overlapping status bars, camera notches, and gesture navigation bars.

2. **Native ExoPlayer Video Player (Android)**:
   Powered by `react-native-video` with ExoPlayer integration.
   - **Supported Codecs/Formats**: HLS (`.m3u8`), DASH (`.mpd`), MP4, MKV, WebM, AAC, AC3, H.264, H.265 (HEVC), AV1, IPTV Live streams.
   - Custom HUD controls (Play/Pause, Seek +/- 10s, progress bar, Live TV badge).

3. **Content Catalog & Live TV**:
   - Movie & TV Series browsing with category filtering.
   - TV Series season & episode picker.
   - Live IPTV channel streaming with proxy fallback.

---

## 📱 How to Run locally

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Run with Expo / React Native CLI
```bash
# Start Expo development server
npm run start

# Run on Android Emulator or USB Debugging connected device
npm run android
```

---

## 🛠️ API Configuration
To point the app to a local development backend instead of production:
Edit [`mobile/src/services/api.ts`](file:///c:/Users/hp/Documents/Dev/MyStreamFlix/mobile/src/services/api.ts):
```ts
const API_BASE_URL = 'http://<YOUR_LOCAL_IP>:3000';
```
