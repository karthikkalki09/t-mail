# Building APK for Play Store - Complete Guide

## Prerequisites

### 1. Install Android Studio
- Download from: https://developer.android.com/studio
- Install with default settings
- This will automatically install Android SDK

### 2. Set Environment Variables
After installing Android Studio, set these environment variables:

**Windows:**
```bash
# Add to System Environment Variables
ANDROID_HOME = C:\Users\[YourUsername]\AppData\Local\Android\Sdk
PATH = %PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

**Or create local.properties file in android folder:**
```properties
sdk.dir=C:\\Users\\[YourUsername]\\AppData\\Local\\Android\\Sdk
```

## Method 1: Using Android Studio (Recommended)

### Step 1: Open Project in Android Studio
```bash
# From nxew directory
npx cap open android
```

### Step 2: Build APK in Android Studio
1. Wait for Gradle sync to complete
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK will be generated in: `android/app/build/outputs/apk/release/`

### Step 3: Generate Signed APK (For Play Store)
1. Go to **Build** → **Generate Signed Bundle / APK**
2. Choose **APK**
3. Create a new keystore or use existing one
4. Fill in the details and build

## Method 2: Using Command Line

### Step 1: Set up Android SDK
```bash
# Create local.properties file
echo "sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk" > android/local.properties
```

### Step 2: Build APK / AAB
```bash
# From nxew directory
npm run build:android
cd android

# Optional: create signing file (or use Android Studio wizard)
# See android/keystore.properties.example
echo MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore>> keystore.properties
echo MYAPP_UPLOAD_STORE_PASSWORD=your-store-password>> keystore.properties
echo MYAPP_UPLOAD_KEY_ALIAS=my-key-alias>> keystore.properties
echo MYAPP_UPLOAD_KEY_PASSWORD=your-key-password>> keystore.properties

.\gradlew assembleRelease   # APK
.\gradlew bundleRelease     # AAB (Play Store preferred)
```

### Step 3: Find APK
The APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

## Method 3: Using Capacitor CLI (Alternative)

```bash
# Build and run on connected device/emulator
npm run run:android

# Or just build
npm run build:android
```

## Play Store Requirements

### 1. App Signing
- Generate a signed APK using Android Studio
- Keep your keystore file safe (you'll need it for updates)

### 2. App Bundle (Recommended)
Instead of APK, Google Play prefers AAB (Android App Bundle):
```bash
# In Android Studio: Build → Build Bundle(s) / APK(s) → Build Bundle(s)
# Or command line:
.\gradlew bundleRelease
```

### 3. Required Information for Play Store
- App name: "NXew Ecommerce"
- Package name: "com.nxew.ecommerce"
- Version: 1.0.0
- App icon (512x512px)
- Screenshots
- App description
- Privacy policy URL

## Troubleshooting

### SDK Location Error
```bash
# Check if Android SDK is installed
dir "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"

# If not found, install Android Studio first
```

### Gradle Build Issues
```bash
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleRelease
```

### Permission Issues
Make sure you have:
- Internet permission
- Network state permission
- Storage permissions (if needed)

## Next Steps After Building APK

1. **Test the APK** on a real device
2. **Upload to Play Console** (https://play.google.com/console)
3. **Fill in store listing** information
4. **Submit for review**

## Current App Configuration

- **App ID**: com.nxew.ecommerce
- **App Name**: NXew Ecommerce
- **Version**: 1.0.0
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)
- **Permissions**: Internet, Network State, Storage, Camera, Vibrate
