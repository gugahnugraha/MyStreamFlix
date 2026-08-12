# Bugfix Requirements Document

## Introduction

MediaPlayer di aplikasi MyStreamFlix Android APK mengalami beberapa bug kritis yang membuat kontrol playback tidak dapat diakses oleh pengguna. System navigation bar Android (gesture bar atau 3-button nav) menutupi bottom HUD panel sehingga tombol play/pause, progress bar, volume, quality selector, speed, subtitle, dan fullscreen tidak bisa di-tap. Selain itu, saat mode fullscreen (immersive mode via Capacitor plugin), kontrol memiliki padding yang tidak memadai dari tepi layar sehingga tidak ergonomis untuk digunakan dengan satu tangan. Bug keempat adalah APK terakhir crash saat dijalankan, kemungkinan disebabkan oleh JS/build error di `MediaPlayer.tsx`. Keempat masalah ini secara kolektif membuat fitur playback utama aplikasi tidak dapat digunakan di Android.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN player aktif dalam mode non-fullscreen pada Android APK THEN the system menampilkan bottom HUD panel (progress bar, tombol kontrol) di posisi yang tertimpa oleh system navigation bar Android, sehingga kontrol tidak dapat di-tap

1.2 WHEN `env(safe-area-inset-bottom)` tersedia di Android WebView THEN the system tidak menerapkan nilai tersebut secara efektif pada bottom HUD panel karena class `pb-safe` tidak memberikan padding yang cukup untuk navigation bar Android

1.3 WHEN player aktif dalam mode fullscreen (immersive mode aktif) pada Android dan user men-tap layar untuk menampilkan controls THEN the system menampilkan kembali controls HUD tanpa padding/offset yang memadai dari tepi layar, sehingga tombol-tombol berada terlalu dekat tepi dan sulit dijangkau dengan satu tangan

1.4 WHEN player berotasi ke landscape dan immersive mode aktif THEN the system tidak mempertimbangkan `env(safe-area-inset-*)` untuk semua sisi (left, right, bottom) sehingga layout HUD tidak menyesuaikan area aman layar dengan benar

1.5 WHEN APK terakhir dijalankan di Android THEN the system crash atau gagal menjalankan aplikasi, kemungkinan akibat JS error atau build error yang bersumber dari `MediaPlayer.tsx`

### Expected Behavior (Correct)

2.1 WHEN player aktif dalam mode non-fullscreen pada Android APK THEN the system SHALL menampilkan bottom HUD panel dengan padding bawah yang cukup — minimal `env(safe-area-inset-bottom)` ditambah extra padding 16–24px — sehingga semua kontrol selalu visible dan dapat di-tap di atas system navigation bar

2.2 WHEN `env(safe-area-inset-bottom)` tersedia di Android WebView THEN the system SHALL menerapkan nilai tersebut secara efektif pada bottom HUD panel dengan inline style atau custom CSS property yang terjamin override class `pb-safe` yang mungkin tidak cukup

2.3 WHEN player aktif dalam mode fullscreen dan user men-tap layar untuk menampilkan controls THEN the system SHALL menampilkan controls HUD dengan padding minimal 16–24px dari semua tepi layar, dengan ukuran touch target tiap tombol minimal 48×48dp sesuai Material Design guidelines

2.4 WHEN player berotasi ke landscape dan immersive mode aktif THEN the system SHALL menerapkan `env(safe-area-inset-left)`, `env(safe-area-inset-right)`, dan `env(safe-area-inset-bottom)` pada container HUD sehingga kontrol tidak terpotong di sisi notch atau kamera

2.5 WHEN APK dibangun dan dijalankan di Android THEN the system SHALL berhasil menjalankan aplikasi tanpa crash, dengan `MediaPlayer.tsx` bebas dari JS error dan kompatibel dengan Capacitor WebView build

### Unchanged Behavior (Regression Prevention)

3.1 WHEN player diakses dari web browser desktop atau mobile browser (bukan APK) THEN the system SHALL CONTINUE TO menampilkan HUD overlay dengan layout dan padding yang sama seperti sebelumnya tanpa perubahan tampilan

3.2 WHEN player dalam mode fullscreen di web browser (HTML5 Fullscreen API) THEN the system SHALL CONTINUE TO menggunakan `requestFullscreen` / `exitFullscreen` dan mengelola orientasi layar seperti saat ini

3.3 WHEN pengguna menggunakan fitur subtitle, quality selector, speed selector, dan subtitle customizer THEN the system SHALL CONTINUE TO menampilkan popup menu di atas HUD bar dengan positioning yang benar dan tidak tertutup safe area

3.4 WHEN playback HLS aktif (live TV, movies, series) THEN the system SHALL CONTINUE TO melakukan streaming, buffering, error fallback, dan simulation mode persis seperti perilaku saat ini

3.5 WHEN player di-close atau rotasi kembali ke portrait THEN the system SHALL CONTINUE TO melepaskan screen orientation lock dan keluar dari immersive mode seperti implementasi `handleClosePlayer` dan listener fullscreen change yang ada

3.6 WHEN player menampilkan episode sidebar untuk TV Series THEN the system SHALL CONTINUE TO merender sidebar episodes dengan layout responsive (full-width di portrait, sidebar di landscape/desktop) tanpa perubahan
