import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type ReminderLanguage = 'en' | 'el';

export interface StreakReminderInput {
  hour: number;
  minute: number;
  language: ReminderLanguage;
  partnerAName: string;
  partnerBName: string;
  streakCount: number;
  previousNotificationId?: string | null;
}

export const STREAK_REMINDER_CHANNEL_ID = 'onera-streak-reminders';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const REMINDER_COPY = {
  en: {
    title: (partnerAName: string, partnerBName: string, streakCount: number) =>
      streakCount > 0
        ? `${partnerAName} & ${partnerBName}, keep your ${streakCount}-day rhythm`
        : 'A little time for each other',
    body: 'One thoughtful question is all it takes to keep your connection going.',
  },
  el: {
    title: (partnerAName: string, partnerBName: string, streakCount: number) =>
      streakCount > 0
        ? `${partnerAName} & ${partnerBName}, συνεχίστε τον ρυθμό των ${streakCount} ημερών`
        : 'Λίγος χρόνος μόνο για εσάς',
    body: 'Μια όμορφη ερώτηση αρκεί για να μείνει ζωντανή η σύνδεσή σας.',
  },
} as const;

export function getStreakReminderCopy(
  language: ReminderLanguage,
  partnerAName: string,
  partnerBName: string,
  streakCount: number,
) {
  const copy = REMINDER_COPY[language];
  return {
    title: copy.title(partnerAName || 'You', partnerBName || 'both', streakCount),
    body: copy.body,
  };
}

function isPermissionGranted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function prepareAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(STREAK_REMINDER_CHANNEL_ID, {
    name: 'Streak reminders',
    description: 'Gentle reminders to make time for your relationship.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export async function requestStreakReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  await prepareAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(current)) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return isPermissionGranted(requested);
}

export async function scheduleStreakReminder(input: StreakReminderInput): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const hasPermission = await requestStreakReminderPermission();
  if (!hasPermission) return null;

  const copy = getStreakReminderCopy(
    input.language,
    input.partnerAName,
    input.partnerBName,
    input.streakCount,
  );

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      sound: 'default',
      data: { kind: 'streak-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: input.hour,
      minute: input.minute,
      ...(Platform.OS === 'android' ? { channelId: STREAK_REMINDER_CHANNEL_ID } : {}),
    },
  });

  if (input.previousNotificationId && input.previousNotificationId !== notificationId) {
    await Notifications.cancelScheduledNotificationAsync(input.previousNotificationId);
  }

  return notificationId;
}

export async function cancelStreakReminder(notificationId: string | null): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
