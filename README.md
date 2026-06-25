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
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start

# 3. Scan the QR code with:
#    iOS  → Camera app
#    Android → Expo Go app
```

---

## Adhan Audio

The app streams the Makkah adhan at runtime from `cdn.islamic.network` — no file download needed. It requires an internet connection when the alarm rings. A fallback URL (Islamic Finder) is tried automatically if the first source fails.

To use a local bundled file instead (works offline):

1. Drop your `adhan.mp3` into the `assets/` folder
2. In `src/screens/AlarmRingingScreen.tsx`, replace the `ADHAN_SOURCES` array with:
   ```ts
   const ADHAN_SOURCES = [require('../../assets/adhan.mp3')];
   ```

---

## Project Structure

```
fajr-companion/
├── App.tsx                         # Entry point — bootstraps nav, handles notification taps
├── assets/adhan.mp3                # Replace with a real adhan for production
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
