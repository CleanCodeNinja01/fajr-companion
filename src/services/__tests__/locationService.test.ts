import {
  inferCountryFromCityName,
  timezoneForCoordinates,
  withTimezone,
  suggestionToLocation,
} from '../locationService';
import { CitySuggestion } from '../../types';

describe('inferCountryFromCityName', () => {
  it('returns the last comma-separated segment as country', () => {
    expect(inferCountryFromCityName('Karachi, Sindh, Pakistan')).toBe('Pakistan');
    expect(inferCountryFromCityName('Dublin, Ireland')).toBe('Ireland');
  });

  it('returns undefined for single-segment names', () => {
    expect(inferCountryFromCityName('Karachi')).toBeUndefined();
    expect(inferCountryFromCityName(undefined)).toBeUndefined();
  });
});

describe('timezoneForCoordinates', () => {
  it('resolves IANA timezone from coordinates', () => {
    expect(timezoneForCoordinates(53.35, -6.26)).toBe('Europe/Dublin');
    expect(timezoneForCoordinates(24.86, 67.01)).toBe('Asia/Karachi');
  });
});

describe('withTimezone', () => {
  it('preserves existing timezone', () => {
    const loc = withTimezone({
      latitude: 53.35,
      longitude: -6.26,
      cityName: 'Dublin, Ireland',
      timezone: 'Europe/Dublin',
    });

    expect(loc.timezone).toBe('Europe/Dublin');
  });

  it('adds timezone when missing', () => {
    const loc = withTimezone({
      latitude: 24.86,
      longitude: 67.01,
      cityName: 'Karachi, Pakistan',
    });

    expect(loc.timezone).toBe('Asia/Karachi');
  });
});

describe('suggestionToLocation', () => {
  it('maps a city suggestion to LocationData with timezone', () => {
    const suggestion: CitySuggestion = {
      displayName: 'Karachi, Sindh, Pakistan',
      cityName: 'Karachi',
      latitude: 24.86,
      longitude: 67.01,
      country: 'Pakistan',
    };

    const loc = suggestionToLocation(suggestion);

    expect(loc).toEqual({
      latitude: 24.86,
      longitude: 67.01,
      cityName: 'Karachi, Sindh, Pakistan',
      country: 'Pakistan',
      timezone: 'Asia/Karachi',
    });
  });
});
