import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { getExpiringItems, getExpiredItems } from '../database/foodItems';
import { getSettings } from '../database/settings';
import { daysUntilExpiration } from './dates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiration-alerts', {
      name: 'Alertas de vencimiento',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function scheduleExpirationNotifications(db: SQLite.SQLiteDatabase): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getSettings(db);
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const [expiring, expired] = await Promise.all([
    getExpiringItems(db, 7),
    getExpiredItems(db),
  ]);

  const allItems = [...expired, ...expiring];

  for (const item of allItems) {
    const days = daysUntilExpiration(item.expirationDate);

    if (days < 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Producto vencido',
          body: `${item.name} ya vencio`,
          data: { itemId: item.id },
        },
        trigger: null,
      });
    } else if (days === 0) {
      if (settings.notifyDaysBefore.includes(0)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vence hoy',
            body: `${item.name} vence hoy!`,
            data: { itemId: item.id },
          },
          trigger: null,
        });
      }
    } else {
      for (const notifyDay of settings.notifyDaysBefore) {
        if (notifyDay > 0 && days === notifyDay) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: days === 1 ? 'Vence manana' : `Vence en ${days} dias`,
              body: `${item.name} vence en ${days} dia${days !== 1 ? 's' : ''}`,
              data: { itemId: item.id },
            },
            trigger: null,
          });
        }
      }
    }
  }

  if (settings.dailySummary) {
    const totalExpiring = expiring.length;
    const totalExpired = expired.length;

    if (totalExpiring > 0 || totalExpired > 0) {
      const parts: string[] = [];
      if (totalExpired > 0) parts.push(`${totalExpired} vencido${totalExpired !== 1 ? 's' : ''}`);
      if (totalExpiring > 0) parts.push(`${totalExpiring} por vencer`);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Resumen diario',
          body: `Tienes ${parts.join(' y ')} producto${(totalExpiring + totalExpired) !== 1 ? 's' : ''}.`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });
    }
  }
}
