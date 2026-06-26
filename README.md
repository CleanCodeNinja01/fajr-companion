# Fajr Companion

A minimal, clean mobile app that helps Muslims wake up for Fajr prayer. Built with React Native and Expo.

---

## Features

- Calculates Fajr time from GPS location using the `adhan` library
- Supports 7 prayer time calculation methods (ISNA, MWL, Egyptian, and more)
- Local alarm notification scheduled at Fajr or up to 45 minutes before
- Configurable snooze with a maximum snooze limit
- Prayer mat photo verification to confirm you're awake
- Daily Fajr streak tracking
- Morning checklist (adhkar, Quran, dua)
- Manual city entry if location permission is denied
- Rose Dusk design system — warm, minimal, peaceful

---

## Screens

| Screen | Description |
|---|---|
| Onboarding | Requests location + notification permissions |
| Home | Shows Fajr time, alarm toggle, wake offset picker |
| Alarm Settings | Offset, snooze count, alarm sound |
| Alarm Ringing | Full-screen alarm with I'm Awake / Snooze |
| Prayer Mat Scan | Camera — take a photo as wake-up proof |
| Confirmation | Streak count + morning checklist |

---

## Prerequisites

- Node.js 18 or later
- **Xcode** (iOS Simulator) or **Android Studio** (Android emulator)
- A **development build** is required for alarm notifications — Expo Go does not support them on Android (SDK 53+)

---

## Setup & Run

Alarm notifications need a native development build (not Expo Go).

```bash
# 1. Install dependencies
npm install

# 2. Build and install the dev client (first time only)
npm run ios      # iOS Simulator
npm run android  # Android emulator (requires Android SDK)

# 3. Start Metro for the dev client
npm start
```

After the first build, run `npm start` and open the **Fajr Companion** app on your device/simulator (not Expo Go).

To build for a physical device via EAS: `npx eas build --profile development --platform ios|android`

---

## Adhan Audio

The Makkah Fajr adhan is bundled in `assets/adhan.mp3` (~4 min, Sheikh Ali Mullah, Masjid al-Haram). It plays **offline** — no internet needed when the alarm rings.

To replace it, drop a new `adhan.mp3` into `assets/` and restart the dev server.

---

## Project Structure

```
fajr-companion/
├── App.tsx                         # Entry point — bootstraps nav, handles notification taps
├── assets/adhan.mp3                # Makkah Fajr adhan (bundled, offline)
└── src/
    ├── types/index.ts              # All shared TypeScript types
    ├── constants/
    │   ├── Colors.ts               # Rose Dusk palette tokens
    │   └── Defaults.ts             # Default settings, method list, offset options
    ├── services/
    │   ├── prayerTimes.ts          # adhan library wrapper
    │   ├── alarmService.ts         # Schedule / cancel Expo local notifications
    │   ├── storage.ts              # AsyncStorage typed get/set helpers
    │   └── locationService.ts      # GPS permission + Nominatim geocoding
    ├── hooks/
    │   ├── useFajrTime.ts          # Today + tomorrow Fajr calculation
    │   ├── useAlarmSettings.ts     # Read / write alarm settings
    │   └── useStreak.ts            # Read / increment streak
    ├── components/
    │   ├── FajrTimeCard.tsx        # Header with time, city, tomorrow time
    │   ├── WakeOffsetSelector.tsx  # Pill picker for wake-up offset
    │   ├── StreakCard.tsx          # Streak count display
    │   └── MorningChecklist.tsx    # Post-Fajr checklist with toggle
    ├── screens/
    │   ├── OnboardingScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── AlarmSettingsScreen.tsx
    │   ├── AlarmRingingScreen.tsx
    │   ├── PrayerMatScanScreen.tsx
    │   └── ConfirmationScreen.tsx
    └── navigation/AppNavigator.tsx # Stack navigator, no visible headers
```

---

## Future Features

- AI-based prayer mat detection
- QR code scan near mat to dismiss alarm
- Weekly Fajr performance report
- Accountability buddy
- All 5 daily prayers, not just Fajr
- Islamic reminders and duas
- Sleep time recommendations
