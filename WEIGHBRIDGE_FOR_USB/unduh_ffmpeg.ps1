# File: unduh_ffmpeg.ps1
param([string]$DestDir = ".")

$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipFile = Join-Path $DestDir "ffmpeg.zip"
$tempDir = Join-Path $DestDir "ffmpeg_temp"

Write-Host "--- MENGUNDUH FFMPEG (RTSP LIVE FEED) ---" -ForegroundColor Cyan
try {
    Write-Host "Mendownload dari gyan.dev... (Harap Tunggu ~70MB)" -ForegroundColor White
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipFile
    Write-Host "Mengekstrak..." -ForegroundColor Yellow
    Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force
    
    # Mencari ffmpeg.exe di dalam folder hasil ekstrak
    $exePath = Get-ChildItem -Path $tempDir -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1
    if ($exePath) {
        Copy-Item $exePath.FullName -Destination $DestDir -Force
        Write-Host "FFMPEG Berhasil Terpasang di $DestDir!" -ForegroundColor Green
    } else {
        Write-Error "ffmpeg.exe tidak ditemukan dalam arsip."
    }
} catch {
    Write-Error "Gagal mengunduh/ekstrak FFMPEG: $($_.Exception.Message)"
} finally {
    if (Test-Path $zipFile) { Remove-Item $zipFile }
    if (Test-Path $tempDir) { Remove-Item -Recurse $tempDir }
}
