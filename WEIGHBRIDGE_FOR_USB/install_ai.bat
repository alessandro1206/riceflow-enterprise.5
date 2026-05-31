@echo off
echo ====================================================
echo   INSTALLING BUMI MAS AI DEPENDENCIES (ALPR)
echo ====================================================
echo.
echo Installing PyTorch, Ultralytics, and EasyOCR...
echo This will take ~2GB of space and several minutes.
echo.

python -m pip install --upgrade pip
pip install ultralytics easyocr opencv-python numpy

echo.
echo Installing FFMPEG (for RTSP Live Feed)...
powershell -ExecutionPolicy Bypass -File unduh_ffmpeg.ps1

echo.
echo Checking for Indonesian Weights (indonesian_lpr.pt)...
if exist "indonesian_lpr.pt" (
    echo [OK] indonesian_lpr.pt found.
) else (
    echo [TIP] You can add a custom 'indonesian_lpr.pt' weights file in this folder for better local accuracy.
)

echo.
echo ====================================================
echo   INSTALLATION COMPLETE!
echo   The local AI is now ready to use (Indonesian Mode).
echo ====================================================
pause
