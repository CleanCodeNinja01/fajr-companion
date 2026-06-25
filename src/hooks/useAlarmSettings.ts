// Read and write alarm settings from AsyncStorage
import { useState, useEffect, useCallback } from 'react';
import { AlarmSettings } from '../types';
import { getAlarmSettings, saveAlarmSettings } from '../services/storage';
import { DEFAULT_ALARM_SETTINGS } from '../constants/Defaults';

export function useAlarmSettings() {
  const [settings, setSettings] = useState<AlarmSettings>(DEFAULT_ALARM_SETTINGS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getAlarmSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const update = useCallback(async (patch: Partial<AlarmSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveAlarmSettings(updated);
  }, [settings]);

  return { settings, loading, update };
}
