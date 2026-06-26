// Returns today's and tomorrow's Fajr time given location + method
import { useState, useEffect } from 'react';
import { getFajrTime, getLocalCalendarDate } from '../services/prayerTimes';
import { CalculationMethodKey, LocationData } from '../types';

interface FajrTimeResult {
  todayFajr:    Date | null;
  tomorrowFajr: Date | null;
  loading:      boolean;
  error:        string | null;
}

export function useFajrTime(
  method: CalculationMethodKey,
  location: LocationData | null,
): FajrTimeResult {
  const [todayFajr,    setTodayFajr]    = useState<Date | null>(null);
  const [tomorrowFajr, setTomorrowFajr] = useState<Date | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function calculate() {
      setLoading(true);
      setError(null);

      if (!location) {
        if (!cancelled) {
          setTodayFajr(null);
          setTomorrowFajr(null);
          setError('No city selected');
          setLoading(false);
        }
        return;
      }

      try {
        const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        const today    = getLocalCalendarDate(tz);
        const tomorrow = getLocalCalendarDate(tz, 1);

        const tf  = getFajrTime(
          location.latitude, location.longitude, method, today, location.country,
        );
        const tmf = getFajrTime(
          location.latitude, location.longitude, method, tomorrow, location.country,
        );

        if (!cancelled) {
          setTodayFajr(tf);
          setTomorrowFajr(tmf);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to calculate Fajr time');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    calculate();
    return () => { cancelled = true; };
  }, [method, location?.latitude, location?.longitude, location?.cityName, location?.country, location?.timezone]);

  return { todayFajr, tomorrowFajr, loading, error };
}
