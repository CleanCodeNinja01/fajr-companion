#!/usr/bin/env node
/** Patch Android splash theme to use full-screen splash.png (run after expo prebuild). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const stylesPath = path.join(root, 'android/app/src/main/res/values/styles.xml');
const drawableDir = path.join(root, 'android/app/src/main/res/drawable');

const SPLASH_STYLE = `<style name="Theme.App.SplashScreen" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowBackground">@drawable/splashscreen_full</item>
    <item name="android:statusBarColor">#1A0E12</item>
    <item name="android:navigationBarColor">#1A0E12</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>`;

// Patch expo-dev-client loading overlay (defaults to white).
function patchDevLauncherSplash() {
  const kt = path.join(
    root,
    'node_modules/expo-dev-launcher/android/src/main/java/expo/modules/devlauncher/splashscreen/DevLauncherSplashScreen.kt',
  );
  if (!fs.existsSync(kt)) return;
  let src = fs.readFileSync(kt, 'utf8');
  const next = src.replace('setBackgroundColor(Color.WHITE)', 'setBackgroundColor(Color.parseColor("#1A0E12"))');
  if (next !== src) {
    fs.writeFileSync(kt, next);
    console.log('patch-android-splash: darkened dev-client loading overlay');
  }
}

patchDevLauncherSplash();

if (!fs.existsSync(stylesPath)) {
  console.warn('patch-android-splash: android project not found, skipping');
  process.exit(0);
}

fs.mkdirSync(drawableDir, { recursive: true });

// PNG and XML cannot share the same resource name on Android.
const splashImage = 'splashscreen_full_image.png';
const legacyConflict = path.join(drawableDir, 'splashscreen_full.png');
if (fs.existsSync(legacyConflict)) fs.unlinkSync(legacyConflict);

fs.copyFileSync(
  path.join(root, 'assets/splash.png'),
  path.join(drawableDir, splashImage),
);

fs.writeFileSync(
  path.join(drawableDir, 'splashscreen_full.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background" />
  <item>
    <bitmap android:gravity="fill" android:src="@drawable/splashscreen_full_image" />
  </item>
</layer-list>
`,
);

let styles = fs.readFileSync(stylesPath, 'utf8');
const needsStylePatch = !styles.includes('@drawable/splashscreen_full"');
if (needsStylePatch) {
  styles = styles.replace(
    /<style name="Theme\.App\.SplashScreen"[\s\S]*?<\/style>/,
    SPLASH_STYLE,
  );
  fs.writeFileSync(stylesPath, styles);
  console.log('patch-android-splash: applied full-screen splash theme');
} else {
  console.log('patch-android-splash: splash theme OK');
}
console.log('patch-android-splash: updated splash drawables');
