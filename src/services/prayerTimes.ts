// Wraps the adhan library to calculate Fajr time from coordinates
import { Coordinates, CalculationMethod, HighLatitudeRule, PrayerTimes } from 'adhan';
import { CalculationMethodKey } from '../types';

const EUROPE_COUNTRIES = new Set([
  'germany', 'ireland', 'united kingdom', 'france', 'netherlands', 'belgium',
  'spain', 'italy', 'austria', 'switzerland', 'poland', 'sweden', 'norway',
  'denmark', 'finland', 'portugal', 'czechia', 'czech republic', 'hungary',
  'romania', 'greece', 'croatia', 'slovakia', 'slovenia', 'bulgaria',
  'serbia', 'ukraine', 'luxembourg', 'malta', 'cyprus', 'iceland',
  'bosnia and herzegovina', 'albania', 'montenegro', 'north macedonia',
  'estonia', 'latvia', 'lithuania', 'moldova', 'belarus',
]);

/** Ireland uses ~58 min before sunrise in summer; UK/Europe use standard angle rule. */
const IRELAND_SUNRISE_CAP = new Set(['ireland']);

/** Minutes before sunrise used by many European mosque timetables in summer. */
const EUROPE_MIN_BEFORE_SUNRISE = 58;

/** Pick the standard method commonly used in each country/region. */
export function defaultCalculationMethodForCountry(country?: string): CalculationMethodKey {
  const c = country?.trim().toLowerCase() ?? '';
  if (!c) return 'MuslimWorldLeague';

  if (c === 'pakistan' || c === 'bangladesh' || c === 'india' || c === 'afghanistan') {
    return 'Karachi';
  }
  if (c === 'united states' || c === 'canada') return 'NorthAmerica';
  if (c === 'saudi arabia') return 'UmmAlQura';
  if (c === 'egypt') return 'Egyptian';
  if (c === 'turkey' || c === 'türkiye') return 'Turkey';
  if (c === 'iran') return 'Tehran';
  if (EUROPE_COUNTRIES.has(c)) return 'MuslimWorldLeague';

  return 'MuslimWorldLeague';
}

function isIrelandSunriseCapCountry(country?: string): boolean {
  return IRELAND_SUNRISE_CAP.has(country?.trim().toLowerCase() ?? '');
}

function getParams(method: CalculationMethodKey, coordinates: Coordinates, country?: string) {
  let params;
  switch (method) {
    case 'MuslimWorldLeague': params = CalculationMethod.MuslimWorldLeague(); break;
    case 'NorthAmerica':      params = CalculationMethod.NorthAmerica(); break;
    case 'Egyptian':          params = CalculationMethod.Egyptian(); break;
    case 'Karachi':           params = CalculationMethod.Karachi(); break;
    case 'UmmAlQura':         params = CalculationMethod.UmmAlQura(); break;
    case 'Tehran':            params = CalculationMethod.Tehran(); break;
    case 'Turkey':            params = CalculationMethod.Turkey(); break;
    default:                  params = CalculationMethod.MuslimWorldLeague();
  }

  const lat = Math.abs(coordinates.latitude);

  // High-latitude angle adjustment (UK, most of Europe, Canada, etc.)
  if (lat > 48 && !isIrelandSunriseCapCountry(country)) {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  }

  return params;
}

/** Ireland mosque timetables use ~58 min before sunrise when 18° Fajr is too early. */
function adjustEuropeanFajr(
  fajr: Date,
  sunrise: Date,
  country: string | undefined,
  latitude: number,
): Date {
  if (!isIrelandSunriseCapCountry(country) || Math.abs(latitude) < 48) return fajr;

  const laterFajr = new Date(
    sunrise.getTime() - EUROPE_MIN_BEFORE_SUNRISE * 60 * 1000,
  );
  return fajr.getTime() < laterFajr.getTime() ? laterFajr : fajr;
}

/** Calendar date for "today" in a city's timezone (for prayer-time calculation). */
export function getLocalCalendarDate(timeZone: string, offsetDays = 0): Date {
  const instant = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const year  = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day   = Number(parts.find(p => p.type === 'day')?.value);
  return new Date(year, month - 1, day);
}

export function getFajrTime(
  latitude: number,
  longitude: number,
  method: CalculationMethodKey,
  date: Date = new Date(),
  country?: string,
): Date {
  const coords = new Coordinates(latitude, longitude);
  const params = getParams(method, coords, country);
  const times = new PrayerTimes(coords, date, params);
  return adjustEuropeanFajr(times.fajr, times.sunrise, country, latitude);
}

export type FajrDisplay = {
  primary:         Date | null;
  primaryLabel:    string;
  secondary:       Date | null;
  secondaryLabel:  'Today' | 'Tomorrow' | null;
};

/** Pick primary (next upcoming) and secondary Fajr for the home card. */
export function resolveFajrDisplay(
  todayFajr: Date | null,
  tomorrowFajr: Date | null,
  nowMs: number = Date.now(),
): FajrDisplay {
  if (!todayFajr) {
    return {
      primary: null,
      primaryLabel: "Today's Fajr",
      secondary: null,
      secondaryLabel: null,
    };
  }

  const todayStillUpcoming = todayFajr.getTime() > nowMs;

  // Before today's Fajr — day is in progress but Fajr hasn't happened yet
  if (todayStillUpcoming) {
    return {
      primary: todayFajr,
      primaryLabel: "Today's Fajr",
      secondary: tomorrowFajr,
      secondaryLabel: tomorrowFajr ? 'Tomorrow' : null,
    };
  }

  // Today's Fajr is done — next wake-up is tomorrow
  if (tomorrowFajr) {
    return {
      primary: tomorrowFajr,
      primaryLabel: "Tomorrow's Fajr",
      secondary: null,
      secondaryLabel: null,
    };
  }

  // Tomorrow not calculated yet — fall back to today's time with a matching label
  return {
    primary: todayFajr,
    primaryLabel: "Today's Fajr",
    secondary: null,
    secondaryLabel: null,
  };
}

/** Format a prayer Date in the city's IANA timezone (not the device timezone). */
export function formatTime(date: Date, timeZone?: string): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatDate(date: Date, timeZone?: string): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(timeZone ? { timeZone } : {}),
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isYesterday(isoDate: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toISODate(yesterday) === isoDate;
}
