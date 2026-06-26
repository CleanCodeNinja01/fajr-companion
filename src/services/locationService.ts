// Handle location permission, geocoding, and city search
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import tzlookup from 'tz-lookup';
import { CitySuggestion, LocationData } from '../types';

const NOMINATIM_HEADERS = {
  'User-Agent': 'FajrCompanion/1.0 (contact@fajrcompanion.app)',
  'Accept-Language': 'en',
};

const CITY_ADDRESSTYPES = new Set([
  'city', 'town', 'village', 'municipality', 'hamlet', 'suburb', 'locality',
]);

function parseNominatimItem(item: Record<string, unknown>): CitySuggestion | null {
  const address = (item.address ?? {}) as Record<string, string>;
  const cityName =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet ??
    address.suburb ??
    (item.name as string | undefined) ??
    String(item.display_name ?? '').split(',')[0];

  if (!cityName) return null;

  const lat = parseFloat(String(item.lat));
  const lon = parseFloat(String(item.lon));
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const region = address.state ?? address.region ?? address.county;
  const country = address.country;
  const parts = [cityName, region, country].filter(Boolean);

  return {
    displayName: parts.join(', '),
    cityName,
    latitude: lat,
    longitude: lon,
    country,
  };
}

function isValidCityResult(item: Record<string, unknown>): boolean {
  const addresstype = String(item.addresstype ?? '');
  if (CITY_ADDRESSTYPES.has(addresstype)) return true;
  if (item.class === 'place') return true;

  if (item.class === 'boundary' && item.type === 'administrative') {
    const address = (item.address ?? {}) as Record<string, string>;
    return !!(
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      CITY_ADDRESSTYPES.has(addresstype)
    );
  }

  return false;
}

/** Last segment of a Nominatim display name is often the country. */
export function inferCountryFromCityName(cityName?: string): string | undefined {
  if (!cityName) return undefined;
  const parts = cityName.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : undefined;
}

export function timezoneForCoordinates(latitude: number, longitude: number): string {
  try {
    return tzlookup(latitude, longitude);
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

/** Ensure timezone is set from coordinates (for saved locations missing it). */
export function withTimezone(loc: LocationData): LocationData {
  if (loc.timezone) return loc;
  return {
    ...loc,
    timezone: timezoneForCoordinates(loc.latitude, loc.longitude),
  };
}

export function suggestionToLocation(suggestion: CitySuggestion): LocationData {
  return withTimezone({
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    cityName: suggestion.displayName,
    country: suggestion.country,
  });
}

export async function getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestLocationPermission(): Promise<boolean> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === 'granted') return true;

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function ensureLocationReady(): Promise<void> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('Location services are turned off. Enable them in your device Settings.');
  }

  const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    if (status === 'denied' && !canAskAgain) {
      throw new Error('PERMANENTLY_DENIED');
    }
    const granted = await requestLocationPermission();
    if (!granted) {
      throw new Error('PERMISSION_DENIED');
    }
  }
}

export async function openLocationSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
}

export async function getCurrentLocation(options?: { fresh?: boolean }): Promise<LocationData> {
  await ensureLocationReady();

  let loc = options?.fresh
    ? null
    : await Location.getLastKnownPositionAsync({ maxAge: 60_000 });

  if (!loc) {
    loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }

  const { latitude, longitude } = loc.coords;

  let cityName: string | undefined;
  let country: string | undefined;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    cityName =
      place?.city ??
      place?.subregion ??
      place?.region ??
      place?.district ??
      undefined;
    country = place?.country ?? undefined;
  } catch {
    // fall back to coordinates-only label below
  }

  if (!cityName) {
    cityName = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
  }

  return withTimezone({ latitude, longitude, cityName, country });
}

/** Search cities worldwide via OpenStreetMap Nominatim (no API key). */
export async function searchCities(query: string): Promise<CitySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(trimmed)}` +
    `&format=json&limit=12&addressdetails=1&dedupe=1`;

  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) throw new Error(`City search failed (${res.status})`);

  const data = (await res.json()) as Record<string, unknown>[];
  const seen = new Set<string>();
  const results: CitySuggestion[] = [];

  for (const item of data) {
    if (!isValidCityResult(item)) continue;
    const parsed = parseNominatimItem(item);
    if (!parsed) continue;

    const key = `${parsed.latitude.toFixed(3)},${parsed.longitude.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(parsed);
    if (results.length >= 6) break;
  }

  // Fallback: accept any result with parseable coordinates if strict filter found nothing
  if (results.length === 0) {
    for (const item of data) {
      const parsed = parseNominatimItem(item);
      if (!parsed) continue;
      const key = `${parsed.latitude.toFixed(3)},${parsed.longitude.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(parsed);
      if (results.length >= 6) break;
    }
  }

  return results;
}

/** Resolve a city name to coordinates via Nominatim. */
export async function geocodeCity(city: string): Promise<LocationData> {
  const suggestions = await searchCities(city);
  if (!suggestions.length) throw new Error('City not found');
  return suggestionToLocation(suggestions[0]);
}
