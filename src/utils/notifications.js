import * as Notifications from 'expo-notifications';
import { parseISO, subDays, isValid, set } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Schedule a local notification for an item expiring soon.
 * Returns notification ID string or null.
 */
export async function scheduleExpiryNotification(item) {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const expiryDate = typeof item.expiryDate === 'string' ? parseISO(item.expiryDate) : item.expiryDate;
    if (!isValid(expiryDate)) return null;

    const notifyDays = item.notifyDaysBefore ?? 1;
    const notifyDate = subDays(expiryDate, notifyDays);

    // Parse custom reminder time (HH:mm), default 09:00
    const [hours, minutes] = (item.customReminderTime || '09:00').split(':').map(Number);
    const triggerDate = set(notifyDate, { hours, minutes, seconds: 0, milliseconds: 0 });

    // Don't schedule if trigger is in the past
    if (triggerDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧊 KitchenSync Reminder',
        body: `${item.name} expires in ${notifyDays} day${notifyDays === 1 ? '' : 's'}!`,
        data: { itemId: item.id },
        sound: true,
      },
      trigger: triggerDate,
    });
    return id;
  } catch (e) {
    console.warn('Failed to schedule notification:', e);
    return null;
  }
}

/**
 * Cancel a scheduled notification by its ID.
 */
export async function cancelNotification(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Failed to cancel notification:', e);
  }
}

/**
 * Cancel all scheduled notifications and reschedule for all active items.
 */
export async function rescheduleAllNotifications(items) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const item of items) {
      if (!item.consumed && !item.trashed) {
        await scheduleExpiryNotification(item);
      }
    }
  } catch (e) {
    console.warn('Failed to reschedule notifications:', e);
  }
}
