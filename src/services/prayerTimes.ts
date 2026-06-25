// Wraps the adhan library to calculate Fajr time from coordinates
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { CalculationMethodKey } from '../types';

function getParams(method: CalculationMethodKey) {
  switch (method) {
    case 'MuslimWorldLeague': return CalculationMethod.MuslimWorldLeague();
    case 'NorthAmerica':      return CalculationMethod.NorthAmerica();
    case 'Egyptian':          return CalculationMethod.Egyptian();
    case 'Karachi':           return CalculationMethod.Karachi();
    case 'UmmAlQura':         return CalculationMethod.UmmAlQura();
    case 'Tehran':            return CalculationMethod.Tehran();
    case 'Turkey':            return CalculationMethod.Turkey();
    default:                  return CalculationMethod.NorthAmerica();
  }
}

export function getFajrTime(
  latitude: number,
  longitude: number,
  method: CalculationMethodKey,
  date: Date = new Date(),
): Date {
  const coords = new Coordinates(latitude, longitude);
  const params = getParams(method);
  const times = new PrayerTimes(coords, date, params);
  return times.fajr;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isYesterday(isoDate: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toISODate(yesterday) === isoDate;
}
