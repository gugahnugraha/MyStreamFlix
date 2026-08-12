# MediaPlayer Android Controls Fix — Bugfix Design

## Overview

MediaPlayer di Android APK mengalami empat bug terkait yang secara kolektif membuat kontrol playback tidak dapat digunakan. Bug utama adalah bottom HUD (`#media-player-bottom-hud`) tertimpa system navigation bar Android karena class `pb-safe` hanya menerapkan `env(safe-area-inset-bottom, 1rem)` tanpa extra clearance. Bug kedua adalah tidak adanya safe-area inset untuk sisi kiri/kanan saat landscape/fullscreen (immersive mode). Bug ketiga adalah beberapa tombol kontrol tidak memenuhi minimum touch target 48×48dp. Bug keempat adalah kemungkinan APK crash dari `MediaPlayer.tsx`.

Pendekatan fix bersifat **surgical** — hanya memodifikasi `paddingBottom`/`paddingLeft`/`paddingRight` pada container HUD dengan inline style yang di-compose secara programatik dari `isFullscreen` dan `isNativeCapacitor()`, tanpa mengubah logika playback, HLS, atau perilaku kontrol yang sudah ada.

---

## Glossary

- **Bug_Condition (C)**: Kondisi yang memicu bug — ketika player aktif di Android APK dan bottom HUD tidak mendapat padding yang cukup untuk menghindari system navigation bar / edge areas
- **Property (P)**: Perilaku yang benar — semua tombol kontrol visible, dapat di-tap, dan memenuhi touch target minimal 48×48dp di semua mode dan orientasi
- **Preservation**: Perilaku yang tidak boleh berubah — semua interaksi yang tidak melibatkan Android safe area (web browser, logika playback, HLS, subtitle, episode switching) harus tetap identik
- **`pb-safe`**: Class CSS di `globals.css` — `padding-bottom: env(safe-area-inset-bottom, 1rem)` — fallback 1rem tidak cukup untuk navigation bar Android yang bisa 48–72dp
- **`isNativeCapacitor()`**: Helper di `native-fullscreen.ts` yang mengembalikan `true` hanya ketika berjalan sebagai APK native (bukan web browser)
- **`isFullscreen`**: State React boolean yang `true` saat immersive mode aktif (Capacitor) atau HTML5 Fullscreen API aktif
- **`viewport-fit=cover`**: Sudah diset di `app/layout.tsx` via `export const viewport: Viewport = { viewportFit: "cover" }` — mengaktifkan `env(safe-area-inset-*)` di Android WebView
- **`ImmersiveModePlugin`**: Capacitor plugin native yang menyembunyikan status bar + navigation bar Android saat fullscreen
- **`#media-player-bottom-hud`**: Div container bottom HUD di `MediaPlayer.tsx` yang saat ini menggunakan class `pb-safe` saja

---

## Bug Details

### Bug Condition

Bug termanifestasi pada empat kondisi yang saling berkaitan:

**C1 — Non-fullscreen HUD overlap:**
Bottom HUD panel tertimpa navigation bar Android karena `pb-safe` hanya menghasilkan `padding-bottom: env(safe-area-inset-bottom, 1rem)`. Pada Android APK, `env(safe-area-inset-bottom)` memang seharusnya berisi tinggi navigation bar, tetapi tidak ada extra clearance sehingga konten menyentuh tepi persis di atas nav bar.

**C2 — Fullscreen/landscape side cutoff:**
Saat immersive mode aktif dan device di-rotate ke landscape, `env(safe-area-inset-left)` dan `env(safe-area-inset-right)` tidak diterapkan ke HUD container, sehingga kontrol di sisi notch/kamera terpotong.

**C3 — Touch target undersized:**
Beberapa tombol di bottom HUD bar (volume mute, quality selector) memiliki `min-h-10` (40px) yang kurang dari 48dp yang disyaratkan Material Design untuk Android.

**C4 — APK crash:**
APK terakhir crash — kemungkinan penyebab: destructuring atau optional chaining yang tidak defensive terhadap nilai `undefined`/`null`, atau tipe TypeScript incompatible dengan Capacitor WebView runtime.

**Formal Specification:**

```
FUNCTION isBugCondition(context)
  INPUT: context = { platform, isFullscreen, isLandscape, hudElement }
  OUTPUT: boolean

  IF platform == "android-apk"
    AND (
      hudElement.paddingBottom < (safeAreaInsetBottom + MINIMUM_CLEARANCE_PX)
      OR (isFullscreen OR isLandscape) AND hudElement.paddingLeft < safeAreaInsetLeft
      OR (isFullscreen OR isLandscape) AND hudElement.paddingRight < safeAreaInsetRight
      OR anyPrimaryButton.touchTargetHeight < 48dp
      OR appCrashesOnLaunch
    )
  THEN RETURN true

  RETURN false

  WHERE MINIMUM_CLEARANCE_PX = 16
END FUNCTION
```

### Contoh Manifestasi Bug

- **C1**: Player non-fullscreen portrait di Pixel 7 (nav bar = 48dp) → tombol play/pause, progress bar, dan quality selector tertimpa nav bar sehingga area 48px dari bawah tidak bisa di-tap
- **C2**: Player fullscreen landscape di device dengan notch kiri → tombol volume/quality di sisi kiri terpotong 30–40px di balik notch
- **C3**: Tombol quality selector di bottom HUD memiliki `min-h-10` (40px/10 Tailwind units = 40px) — kurang 8px dari requirement 48dp
- **C4**: APK launch → crash sebelum player dibuka, kemungkinan dari import `ScreenOrientation` atau `Capacitor.Plugins` yang diakses sebelum plugin terdaftar

---

## Expected Behavior

### Preservation Requirements

**Perilaku yang tidak boleh berubah:**
- Mouse click dan touch pada tombol kontrol di web browser (desktop/mobile) harus terus bekerja persis seperti sebelumnya tanpa perubahan tampilan
- Logika HLS streaming, buffering, error fallback, dan simulation mode tidak dimodifikasi sama sekali
- HTML5 Fullscreen API (web browser) dan `requestFullscreen`/`exitFullscreen` tetap berjalan seperti sebelumnya
- Semua popup menu (quality, speed, subtitle, subtitle customizer) tetap muncul di atas HUD bar dengan positioning yang benar
- Episode sidebar untuk TV Series, season selector, dan auto-play countdown tetap berfungsi identik
- Screen lock, skip intro, dan semua overlay lainnya tetap di posisi yang sama
- Subtitle rendering, caption display, dan customizer tidak berubah
- Progress beacon, resume point, dan playback history sync tidak diubah

**Scope non-buggy inputs:**
Semua input yang tidak melibatkan kondisi Android APK dengan insufficient safe-area padding sepenuhnya tidak terpengaruh oleh fix ini. Ini mencakup:
- Semua interaksi di web browser (bukan APK)
- Logika playback (play/pause, seek, volume, speed, quality selection)
- Keyboard dan mouse events
- Orientasi dan fullscreen di web browser

**Catatan:** Perilaku yang benar (expected correct behavior) untuk kondisi buggy didefinisikan di bagian Correctness Properties (Property 1 & 2).

---

## Hypothesized Root Cause

Berdasarkan analisis kode `MediaPlayer.tsx` dan `globals.css`:

1. **`pb-safe` fallback tidak cukup untuk Android nav bar (C1):**
   Class `pb-safe` di `globals.css` didefinisikan sebagai `padding-bottom: env(safe-area-inset-bottom, 1rem)`. Masalahnya adalah fallback `1rem` (16px) digunakan ketika `env()` tidak tersedia — tetapi bahkan ketika `env(safe-area-inset-bottom)` TERSEDIA dan berisi nilai nav bar (misal 48dp), tidak ada extra clearance ditambahkan. Pada Android gestur navigation (full-gesture mode), inset bisa lebih kecil dari yang diperkirakan, dan konten masih menyentuh tepi area nav bar.

2. **Tidak ada padding sisi untuk landscape/fullscreen (C2):**
   Container HUD (`#media-player-bottom-hud`) menggunakan `pb-safe` tapi tidak ada `pl-safe` / `pr-safe` yang di-apply secara kondisional saat `isFullscreen` atau landscape. `globals.css` mendefinisikan padding kiri/kanan hanya untuk `body`, tidak untuk elemen player.

3. **Touch target inconsistency (C3):**
   Beberapa tombol di bottom controls bar menggunakan `min-h-10` (40px) — satu step di bawah `min-h-11` (44px) atau `min-h-12` (48px). Khususnya: quality selector button menggunakan `py-2 sm:py-1.5` tanpa explicit `min-h`, dan subtitle customizer toggle menggunakan `min-w-10 min-h-10`.

4. **Potential crash: unsafe Capacitor plugin access atau TS runtime error (C4):**
   Di `native-fullscreen.ts`, `getImmersiveModePlugin()` mengakses `(Capacitor as any).Plugins?.ImmersiveMode` — ini defensif. Namun di `MediaPlayer.tsx`, `ScreenOrientation` dari `@capacitor/screen-orientation` diimport dan dipanggil langsung. Jika plugin tidak terdaftar di Android build atau ada version mismatch, ini bisa throw unhandled exception. Kemungkinan lain: tipe konflik antara `ReturnType<typeof setTimeout>` di environment browser vs Node yang bisa muncul di Capacitor WebView bundling.

---

## Correctness Properties

Property 1: Bug Condition — Android HUD Controls Accessible Above System UI

_For any_ konteks di mana `isBugCondition` bernilai true (Android APK aktif, HUD tidak mendapat clearance cukup dari system UI), kode yang sudah diperbaiki SHALL menampilkan semua tombol kontrol bottom HUD dengan padding yang sufficient sehingga:
- Seluruh area tombol visible dan dapat di-tap di atas system navigation bar
- Padding bottom minimal = `env(safe-area-inset-bottom, 0px) + 16px` di non-fullscreen
- Padding left/right minimal = `env(safe-area-inset-left/right, 0px)` di fullscreen/landscape
- Semua primary touch target (play/pause, mute, fullscreen) minimal 48×48px

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation — Non-Android Web Behavior Unchanged

_For any_ input di mana `isBugCondition` bernilai false (web browser, atau Android APK dengan kondisi yang tidak buggy), kode yang sudah diperbaiki SHALL menghasilkan behavior yang identik dengan kode original — tidak ada perubahan tampilan, layout, atau fungsionalitas untuk platform non-APK.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

---

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

#### Fix C1 & C2 — Safe-area padding pada HUD container

**File:** `src/components/MediaPlayer.tsx`

**Target element:** `<div className="space-y-3 sm:space-y-4 pb-safe" id="media-player-bottom-hud">`

**Specific Changes:**

1. **Tambahkan state `isLandscape`** — detect orientasi via `window.screen.orientation` atau media query untuk membedakan kapan sisi safe-area perlu diterapkan:
   ```tsx
   const [isLandscape, setIsLandscape] = useState(
     () => typeof window !== "undefined" && window.innerWidth > window.innerHeight
   );
   // Dalam useEffect: listen orientationchange / resize
   ```

2. **Compose `hudStyle` inline style object** — dibuat secara kondisional berdasarkan `isNativeCapacitor()`, `isFullscreen`, dan `isLandscape`:
   ```tsx
   const hudStyle: React.CSSProperties = isNativeCapacitor()
     ? {
         paddingBottom: (isFullscreen || isLandscape)
           ? "env(safe-area-inset-bottom, 0px)"
           : "calc(env(safe-area-inset-bottom, 0px) + 16px)",
         paddingLeft: (isFullscreen || isLandscape)
           ? "env(safe-area-inset-left, 0px)"
           : undefined,
         paddingRight: (isFullscreen || isLandscape)
           ? "env(safe-area-inset-right, 0px)"
           : undefined,
       }
     : {};
   ```

3. **Terapkan `hudStyle` dan hapus `pb-safe`** dari HUD container:
   ```tsx
   <div
     className="space-y-3 sm:space-y-4"
     id="media-player-bottom-hud"
     style={hudStyle}
   >
   ```
   `pb-safe` dihapus dari className karena digantikan oleh inline style yang lebih presisi.

#### Fix C3 — Touch target consistency

**File:** `src/components/MediaPlayer.tsx`

**Specific Changes:**

4. **Quality selector button** — tambahkan `min-h-11` (44px) atau ubah ke `min-h-12` (48px) untuk semua breakpoints, bukan hanya `min-h-10 sm:min-h-0`:
   ```tsx
   // Sebelum:
   className="... min-h-10 sm:min-h-0"
   // Sesudah:
   className="... min-h-11"
   ```

5. **Subtitle customizer toggle** — ubah dari `min-w-10 min-h-10` ke `min-w-11 min-h-11`:
   ```tsx
   // Sebelum:
   className="... min-w-10 min-h-10 ..."
   // Sesudah:
   className="... min-w-11 min-h-11 ..."
   ```

6. **Speed selector button** — tambahkan `min-h-11` eksplisit (sudah ada `min-h-10 sm:min-h-0`, ubah ke `min-h-11`).

#### Fix C4 — APK crash investigation & defensive coding

**File:** `src/components/MediaPlayer.tsx`

**Specific Changes:**

7. **Wrap `ScreenOrientation` calls dalam try-catch yang lebih granular** — pastikan semua call ke `ScreenOrientation.lock()` dan `ScreenOrientation.unlock()` sudah dalam try-catch (sudah ada di beberapa tempat, verifikasi konsistensi di `toggleFullscreen` dan `handleClosePlayer`).

8. **Verifikasi import `ScreenOrientation`** — pastikan `@capacitor/screen-orientation` terdaftar di `package.json` dan sync ke Android. Jika belum, semua panggilan `.lock()` / `.unlock()` perlu di-guard dengan `isNativeCapacitor()` check.

9. **Fix `ReturnType<typeof setTimeout>` type conflict** — ganti deklarasi:
   ```tsx
   // Sebelum:
   const startupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   // Sesudah (kompatibel Capacitor WebView):
   const startupTimeoutRef = useRef<number | null>(null);
   // Dan cast di assignment:
   startupTimeoutRef.current = window.setTimeout(() => { ... }, 12000) as number;
   ```

#### Viewport meta — sudah benar

`app/layout.tsx` sudah menggunakan `export const viewport: Viewport = { viewportFit: "cover" }` via Next.js Viewport API — ini menghasilkan `<meta name="viewport" content="...viewport-fit=cover">` yang mengaktifkan `env(safe-area-inset-*)` di Android WebView. **Tidak ada perubahan diperlukan.**

---

## Testing Strategy

### Validation Approach

Testing mengikuti dua fase: pertama, surface counterexample yang membuktikan bug pada kode unfixed (exploratory), kemudian verify fix berjalan benar dan tidak memperkenalkan regresi (fix checking + preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples yang mendemonstrasikan bug SEBELUM fix diimplementasikan. Konfirmasi atau refute root cause analysis. Jika direfute, perlu re-hipotesis.

**Test Plan**: Buat unit test yang mocking `isNativeCapacitor()` = true dan mengassert computed padding values dari HUD element. Jalankan pada kode UNFIXED untuk observe failures.

**Test Cases:**

1. **Non-fullscreen HUD padding test** (akan fail pada unfixed code):
   - Mock `isNativeCapacitor()` → `true`, `isFullscreen` → `false`
   - Render MediaPlayer, query `#media-player-bottom-hud`
   - Assert `paddingBottom` > 16px (harus include safe-area + extra clearance)
   - Dengan `pb-safe` saja, padding = `env(safe-area-inset-bottom, 1rem)` — tanpa extra → FAIL

2. **Fullscreen landscape side padding test** (akan fail pada unfixed code):
   - Mock `isNativeCapacitor()` → `true`, `isFullscreen` → `true`
   - Assert `paddingLeft` dan `paddingRight` mengandung `env(safe-area-inset-left/right)`
   - Tanpa fix, tidak ada padding sisi → FAIL

3. **Touch target size test** (akan fail pada unfixed code):
   - Query semua button di `#media-player-bottom-hud`
   - Assert `offsetHeight >= 48` dan `offsetWidth >= 48`
   - Quality selector dan subtitle toggle dengan `min-h-10` → FAIL

4. **APK crash — ScreenOrientation defensive test** (mungkin fail):
   - Mock `ScreenOrientation.lock` untuk throw Error
   - Render MediaPlayer dan panggil `toggleFullscreen`
   - Assert tidak ada unhandled exception → perlu verify existing try-catch coverage

**Expected Counterexamples:**
- HUD bottom padding hanya sebesar `1rem` fallback, tidak ada extra clearance
- Padding sisi kiri/kanan tidak ada saat landscape/fullscreen
- Beberapa button memiliki rendered height 40px bukan 48px
- `ScreenOrientation` call mungkin throw tanpa catch di beberapa codepath

### Fix Checking

**Goal**: Verify bahwa untuk semua input di mana bug condition terpenuhi, kode yang sudah diperbaiki menghasilkan perilaku yang benar.

**Pseudocode:**
```
FOR ALL context WHERE isBugCondition(context) DO
  result := renderMediaPlayer_fixed(context)
  ASSERT result.hudPaddingBottom >= safeAreaInsetBottom + 16
  ASSERT (context.isFullscreen OR context.isLandscape)
         IMPLIES result.hudPaddingLeft >= safeAreaInsetLeft
  ASSERT (context.isFullscreen OR context.isLandscape)
         IMPLIES result.hudPaddingRight >= safeAreaInsetRight
  ASSERT ALL primaryButtons.touchTarget >= 48x48
  ASSERT appDoesNotCrash()
END FOR
```

### Preservation Checking

**Goal**: Verify bahwa untuk semua input di mana bug condition TIDAK terpenuhi, kode yang sudah diperbaiki menghasilkan hasil yang sama dengan kode original.

**Pseudocode:**
```
FOR ALL context WHERE NOT isBugCondition(context) DO
  ASSERT renderMediaPlayer_original(context) == renderMediaPlayer_fixed(context)
  // Khususnya: platform == "web-browser" harus menghasilkan output identik
END FOR
```

**Testing Approach**: Property-based testing direkomendasikan untuk preservation checking karena:
- Menghasilkan banyak kombinasi props/state secara otomatis (berbagai `movie` types, `isFullscreen` states, `isSimulating` states)
- Menangkap edge case yang mungkin terlewat unit test manual
- Memberikan jaminan kuat bahwa behavior untuk non-Android input tidak berubah

**Test Plan**: Observe behavior di web browser (unfixed) terlebih dahulu, kemudian tulis property-based tests yang capture behavior tersebut.

**Test Cases:**
1. **Web browser layout preservation**: Render dengan `isNativeCapacitor()` = false → assert HUD tidak memiliki inline `paddingBottom` style (style object kosong)
2. **Playback controls preservation**: Trigger play/pause, seek, volume, speed — assert state changes identik sebelum dan sesudah fix
3. **Popup menu positioning preservation**: Open quality/speed/subtitle menu — assert `bottom-12` / `bottom-10` positioning tidak berubah
4. **Episode sidebar preservation**: Render series content — assert sidebar renders identik

### Unit Tests

- Test `hudStyle` computed value untuk semua kombinasi: `{ isNativeCapacitor: true/false } × { isFullscreen: true/false } × { isLandscape: true/false }`
- Test bahwa `pb-safe` tidak lagi ada di className HUD saat `isNativeCapacitor()` = true
- Test defensive coding pada `ScreenOrientation` calls — mock throw, assert no crash
- Test `isLandscape` state update saat orientasi berubah

### Property-Based Tests

- Generate random `isFullscreen` dan `isLandscape` combinations dengan `isNativeCapacitor()` = true → verify padding formula `calc(env(...) + 16px)` vs `env(...)` dipilih dengan benar
- Generate random `movie` objects (livetv, series, movie) → verify HUD renders tanpa crash
- Generate random `volume`, `playbackRate`, `currentTime` values → verify behavior identik antara original dan fixed code untuk platform = web

### Integration Tests

- Test full player lifecycle: open → play → toggle fullscreen → rotate landscape → tap controls → close di environment yang mocking Capacitor
- Test bahwa immersive mode listener (`addImmersiveStateListener`) masih terpanggil dengan benar setelah fix
- Test visual: semua tombol kontrol memiliki visible area yang tidak terhalang oleh simulasi navigation bar (posisi `bottom: 48px`)
