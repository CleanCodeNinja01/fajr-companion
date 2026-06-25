// Read, write and increment the Fajr streak
import { useState, useEffect } from 'react';
import { StreakData } from '../types';
import { getStreak, saveStreak } from '../services/storage';
import { toISODate, isYesterday } from '../services/prayerTimes';
import { DEFAULT_STREAK } from '../constants/Defaults';

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);

  useEffect(() => {
    getStreak().then(setStreak);
  }, []);

  async function incrementStreak(): Promise<StreakData> {
    const current = await getStreak();
    const today   = toISODate(new Date());

    // Already confirmed today — no double count
    if (current.lastConfirmedDate === today) return current;

    const newCount =
      current.lastConfirmedDate && isYesterday(current.lastConfirmedDate)
        ? current.count + 1
        : 1;

    const updated: StreakData = { count: newCount, lastConfirmedDate: today };
    await saveStreak(updated);
    setStreak(updated);
    return updated;
  }

  return { streak, incrementStreak };
}
