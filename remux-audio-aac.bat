@echo off
chcp 65001 >nul
title MyStreamFlix - Universal Audio Remuxer (MKV to Web MP4)
color 0B

echo ===============================================================================
echo                MYSTREAMFLIX - UNIVERSAL AUDIO REMUXER TOOL
echo   Mengonversi Audio DTS/AC3 ke AAC Stereo Tanpa Merusak/Render Ulang Video
echo             (Proses hanya butuh 15-30 detik per film dengan -c:v copy)
echo ===============================================================================
echo.

:: 1. Cek ketersediaan FFmpeg
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] PERINGATAN: FFmpeg belum terdeteksi di sistem Windows Anda.
    echo.
    echo Apakah Anda ingin menginstall FFmpeg secara otomatis sekarang via Windows Winget?
    echo [1] Ya, install FFmpeg otomatis sekarang
    echo [2] Tidak, saya install manual nanti
    echo.
    set /p installchoice="Pilihan Anda (1/2): "
    if "%installchoice%"=="1" (
        echo.
        echo [*] Mengunduh dan memasang FFmpeg via winget, mohon tunggu sebentar...
        winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
        echo.
        echo [*] Selesai! Silakan buka kembali file .bat ini agar PATH FFmpeg terbaca.
        pause
        exit /b
    ) else (
        echo.
        echo Silakan install FFmpeg terlebih dahulu dari: https://ffmpeg.org/download.html
        echo atau jalankan di Command Prompt: winget install -e --id Gyan.FFmpeg
        pause
        exit /b
    )
)

:: 2. Cek apakah ada file yang di-Drag and Drop
if "%~1"=="" goto :AskFolder

:ProcessArgs
echo [*] Mode: Memproses file yang di-Drag and Drop...
echo.

set "count=0"
:LoopArgs
if "%~1"=="" goto :Finished
if /I "%~x1"==".mkv" (
    set /a count+=1
    echo -------------------------------------------------------------------------------
    echo [%%count%%] Memproses: "%~nx1"
    echo Lokasi: "%~dp1"
    echo.
    
    ffmpeg -y -hide_banner -loglevel info -i "%~1" -c:v copy -c:a aac -b:a 192k -ac 2 -movflags +faststart "%~dpn1_web.mp4"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [OK] BERHASIL! File tersimpan sebagai: "%~dpn1_web.mp4"
        echo      Format: Video H.264/HEVC (Asli) + Audio AAC Stereo (Web & HP Ready)
    ) else (
        echo.
        echo [X] GAGAL memproses "%~nx1".
    )
) else (
    echo [!] Melewati "%~nx1" (Bukan berkas .mkv)
)

shift
goto :LoopArgs

:AskFolder
echo Anda dapat menggunakan tool ini dengan 2 cara:
echo   1. Drag & drop satu atau banyak file .mkv langsung ke file .bat ini.
echo   2. Atau masukkan path folder yang berisi file-file .mkv di bawah ini.
echo.
set /p targetfolder="Masukkan path folder (Tekan Enter untuk folder saat ini): "

if "%targetfolder%"=="" set "targetfolder=%~dp0"
:: Hilangkan tanda kutip jika pengguna drag folder ke terminal
set "targetfolder=%targetfolder:"=%"

if not exist "%targetfolder%" (
    echo [X] Folder tidak ditemukan: "%targetfolder%"
    echo.
    pause
    exit /b
)

echo.
echo [*] Memindai seluruh file .mkv di dalam: "%targetfolder%"
echo.

set "fileCount=0"
for /R "%targetfolder%" %%F in (*.mkv) do (
    set /a fileCount+=1
    echo ===============================================================================
    echo [!fileCount!] Mengonversi: "%%~nxF"
    echo.

    ffmpeg -y -hide_banner -loglevel info -i "%%F" -c:v copy -c:a aac -b:a 192k -ac 2 -movflags +faststart "%%~dpnF_web.mp4"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [OK] BERHASIL: "%%~dpnF_web.mp4"
    ) else (
        echo.
        echo [X] GAGAL: "%%~nxF"
    )
)

if %fileCount% EQU 0 (
    echo [!] Tidak ditemukan file dengan ekstensi .mkv di folder tersebut.
)

:Finished
echo.
echo ===============================================================================
echo                           SEMUA PROSES SELESAI!
echo  Seluruh file berformat MP4 dengan audio AAC Stereo kini siap di-upload ke:
echo  Google Drive / Cloudflare R2 / Server Katalog MyStreamFlix.
echo  Pasti 100%% bersuara normal di Web PC, Android, iPhone, dan Smart TV!
echo ===============================================================================
echo.
pause
