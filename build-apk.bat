@echo off
echo Building NXew Ecommerce APK...
echo.

echo Step 1: Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Sync failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Building Android APK...
cd android
call .\gradlew assembleRelease
if %errorlevel% neq 0 (
    echo APK build failed! Make sure Android SDK is installed.
    echo Please install Android Studio from: https://developer.android.com/studio
    echo.
    echo Alternative: Open Android Studio and run:
    echo npx cap open android
    pause
    exit /b 1
)

echo.
echo ✅ APK built successfully!
echo Location: android\app\build\outputs\apk\release\app-release.apk
echo.
echo Next steps:
echo 1. Test the APK on your device
echo 2. Upload to Google Play Console
echo 3. Follow the Play Store submission process
echo.
pause
