import {
  defaultCalculationMethodForCountry,
  resolveFajrDisplay,
  getLocalCalendarDate,
  getFajrTime,
  toISODate,
  isYesterday,
  formatTime,
} from '../prayerTimes';

describe('defaultCalculationMethodForCountry', () => {
  it('returns Karachi for Pakistan and South Asia', () => {
    expect(defaultCalculationMethodForCountry('Pakistan')).toBe('Karachi');
    expect(defaultCalculationMethodForCountry('India')).toBe('Karachi');
  });

  it('returns NorthAmerica for US and Canada', () => {
    expect(defaultCalculationMethodForCountry('United States')).toBe('NorthAmerica');
    expect(defaultCalculationMethodForCountry('Canada')).toBe('NorthAmerica');
  });

  it('returns UmmAlQura for Saudi Arabia', () => {
    expect(defaultCalculationMethodForCountry('Saudi Arabia')).toBe('UmmAlQura');
  });

  it('returns MuslimWorldLeague for European countries', () => {
    expect(defaultCalculationMethodForCountry('Ireland')).toBe('MuslimWorldLeague');
    expect(defaultCalculationMethodForCountry('Germany')).toBe('MuslimWorldLeague');
  });

  it('defaults to MuslimWorldLeague when country is unknown or empty', () => {
    expect(defaultCalculationMethodForCountry()).toBe('MuslimWorldLeague');
    expect(defaultCalculationMethodForCountry('')).toBe('MuslimWorldLeague');
    expect(defaultCalculationMethodForCountry('Japan')).toBe('MuslimWorldLeague');
  });
});

describe('resolveFajrDisplay', () => {
  const todayFajr = new Date('2026-06-27T04:30:00');
  const tomorrowFajr = new Date('2026-06-28T04:25:00');

  it('shows today as primary when Fajr has not passed yet', () => {
    const now = new Date('2026-06-27T03:00:00').getTime();
    const result = resolveFajrDisplay(todayFajr, tomorrowFajr, now);

    expect(result.primary).toEqual(todayFajr);
    expect(result.primaryLabel).toBe("Today's Fajr");
    expect(result.secondary).toEqual(tomorrowFajr);
    expect(result.secondaryLabel).toBe('Tomorrow');
  });

  it('shows tomorrow as primary after today Fajr has passed', () => {
    const now = new Date('2026-06-27T10:00:00').getTime();
    const result = resolveFajrDisplay(todayFajr, tomorrowFajr, now);

    expect(result.primary).toEqual(tomorrowFajr);
    expect(result.primaryLabel).toBe("Tomorrow's Fajr");
    expect(result.secondary).toBeNull();
    expect(result.secondaryLabel).toBeNull();
  });

  it('returns null primary when today Fajr is unavailable', () => {
    const result = resolveFajrDisplay(null, tomorrowFajr, Date.now());

    expect(result.primary).toBeNull();
    expect(result.secondary).toBeNull();
    expect(result.secondaryLabel).toBeNull();
  });

  it('falls back to today when tomorrow is missing and Fajr passed', () => {
    const now = new Date('2026-06-27T10:00:00').getTime();
    const result = resolveFajrDisplay(todayFajr, null, now);

    expect(result.primary).toEqual(todayFajr);
    expect(result.primaryLabel).toBe("Today's Fajr");
    expect(result.secondary).toBeNull();
  });
});

describe('getLocalCalendarDate', () => {
  it('returns midnight local calendar date for a timezone', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-27T23:30:00Z'));

    const d = getLocalCalendarDate('Asia/Karachi');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(28);

    jest.useRealTimers();
  });

  it('supports offsetDays for tomorrow in a timezone', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-27T12:00:00Z'));

    const d = getLocalCalendarDate('Europe/Dublin', 1);
    expect(d.getDate()).toBe(28);

    jest.useRealTimers();
  });
});

describe('getFajrTime', () => {
  it('returns a Date for known coordinates', () => {
    const date = new Date(2026, 5, 27);
    const fajr = getFajrTime(24.86, 67.01, 'Karachi', date, 'Pakistan');

    expect(fajr).toBeInstanceOf(Date);
    expect(fajr.getHours()).toBeGreaterThanOrEqual(0);
    expect(fajr.getHours()).toBeLessThan(6);
  });

  it('applies Ireland sunrise cap in summer when angle Fajr is too early', () => {
    const date = new Date(2026, 5, 21);
    const fajr = getFajrTime(53.35, -6.26, 'MuslimWorldLeague', date, 'Ireland');

    expect(fajr).toBeInstanceOf(Date);
    expect(fajr.getHours()).toBeGreaterThanOrEqual(3);
  });
});

describe('toISODate and isYesterday', () => {
  it('formats dates as YYYY-MM-DD', () => {
    expect(toISODate(new Date('2026-06-27T15:00:00Z'))).toBe('2026-06-27');
  });

  it('detects yesterday relative to today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-27T12:00:00Z'));

    expect(isYesterday('2026-06-26')).toBe(true);
    expect(isYesterday('2026-06-27')).toBe(false);
    expect(isYesterday('2026-06-25')).toBe(false);

    jest.useRealTimers();
  });
});

describe('formatTime', () => {
  it('formats time in a given timezone', () => {
    const date = new Date('2026-06-27T04:30:00Z');
    const formatted = formatTime(date, 'Asia/Karachi');

    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });
});
