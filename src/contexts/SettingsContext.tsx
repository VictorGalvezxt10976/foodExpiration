import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings, setSettings as dbSetSettings } from '../database/settings';
import { scheduleExpirationNotifications } from '../utils/notifications';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => Promise<void>;
  rescheduleNotifications: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSetting: async () => {},
  rescheduleNotifications: async () => {},
});

export function SettingsProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [settings, setLocalSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const rescheduleNotifications = useCallback(async () => {
    try {
      await scheduleExpirationNotifications(db);
    } catch {
      // Silently fail — permissions may not be granted
    }
  }, [db]);

  useEffect(() => {
    (async () => {
      const s = await getSettings(db);
      setLocalSettings(s);
      // Schedule notifications on app startup
      await rescheduleNotifications();
    })();
  }, [db, rescheduleNotifications]);

  const updateSetting = useCallback(
    async (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      await dbSetSettings(db, { [key]: value });
      // Re-schedule when notification settings change
      if (key === 'notifyDaysBefore' || key === 'dailySummary') {
        await rescheduleNotifications();
      }
    },
    [db, rescheduleNotifications]
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, rescheduleNotifications }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
