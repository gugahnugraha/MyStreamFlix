# ============================================================
# MyStreamFlix Android TV - Automated APK Build Script
# ============================================================
param (
    [string]$BuildType = "debug"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   MyStreamFlix TV - Android TV APK Builder" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$TvDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AndroidDir = Join-Path $TvDir "android"

# Step 1: Check Java Installation
try {
    $javaVersion = java -version 2>&1
    Write-Host "[✓] Java runtime terdeteksi." -ForegroundColor Green
} catch {
    Write-Host "[!] Java JDK (v17+) belum terdeteksi di PATH." -ForegroundColor Yellow
    Write-Host "    Pastikan JDK 17 atau Android Studio terinstal.`n"
}

# Step 2: Check Android SDK
if ($env:ANDROID_HOME -or $env:ANDROID_SDK_ROOT) {
    $sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }
    Write-Host "[✓] Android SDK terdeteksi di: $sdk" -ForegroundColor Green
} else {
    $localSdk = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $localSdk) {
        $env:ANDROID_HOME = $localSdk
        Write-Host "[✓] Menemukan Android SDK di: $localSdk" -ForegroundColor Green
    } else {
        Write-Host "[!] ANDROID_HOME environment variable belum disetel." -ForegroundColor Yellow
    }
}

# Step 3: Run Gradle Build
Set-Location $AndroidDir

Write-Host "`n[*] Menjalankan kompilasi Gradle untuk Android TV..." -ForegroundColor Cyan
$gradleCmd = if ($IsWindows -or ($env:OS -like "*Windows*")) { ".\gradlew.bat" } else { "./gradlew" }

if (!(Test-Path $gradleCmd)) {
    # Generate wrapper if missing
    try {
        gradle wrapper
    } catch {}
}

$task = if ($BuildType -eq "release") { "assembleRelease" } else { "assembleDebug" }

try {
    & $gradleCmd $task
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "[✓] BERHASIL! APK Android TV siap diinstall." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green

    $apkPath = Join-Path $AndroidDir "app\build\outputs\apk\$BuildType\app-$BuildType.apk"
    if (Test-Path $apkPath) {
        Write-Host "`nFile APK: $apkPath" -ForegroundColor Yellow
        Write-Host "`nCara install ke Android TV via ADB:" -ForegroundColor Cyan
        Write-Host "  1. Aktifkan 'Developer Options' & 'USB Debugging' di Android TV" -ForegroundColor White
        Write-Host "  2. Sambungkan ke TV: adb connect <IP_ANDROID_TV>:5555" -ForegroundColor White
        Write-Host "  3. Install APK: adb install -r `"$apkPath`"" -ForegroundColor White
    }
} catch {
    Write-Host "`n[!] Kompilasi langsung via CLI membutuhkan Android Build Tools." -ForegroundColor Yellow
    Write-Host "    Alternatif termudah:" -ForegroundColor Cyan
    Write-Host "    1. Buka Android Studio" -ForegroundColor White
    Write-Host "    2. Pilih 'Open an Existing Project'" -ForegroundColor White
    Write-Host "    3. Pilih folder: $AndroidDir" -ForegroundColor White
    Write-Host "    4. Klik menu Build -> Build Bundle(s) / APK(s) -> Build APK(s)" -ForegroundColor White
}

Set-Location $TvDir
