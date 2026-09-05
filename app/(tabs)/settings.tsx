import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { usePartnersStore } from '@/store/partners.store';
import { useSessionStore } from '@/store/session.store';
import { useMomentsStore } from '@/store/moments.store';
import { useMoodStore } from '@/store/mood.store';
import { useInsightsStore } from '@/store/insights.store';
import type { RelationshipStage } from '@/lib/data/questions';
import { useRemindersStore } from '@/store/reminders.store';
import { cancelStreakReminder, scheduleStreakReminder } from '@/lib/streak-reminders';

const AVATARS = ['🌸', '🌿', '🌙', '☀️', '🌊', '🍃', '🌺', '🦋', '🌻', '🕊️', '🌹', '🌾'];

const STAGES: { id: RelationshipStage; label: string }[] = [
  { id: 'break-the-ice', label: 'Break the Ice' },
  { id: 'dating', label: 'Dating' },
  { id: 'long-term', label: 'Long-Term' },
];

const REMINDER_TIMES = [
  { hour: 19, minute: 0, label: '7:00 PM' },
  { hour: 20, minute: 0, label: '8:00 PM' },
  { hour: 21, minute: 0, label: '9:00 PM' },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { partnerA, partnerB, relationshipStage, streakCount, updatePartners, updateStage, reset: resetPartners } = usePartnersStore();
  const { sessionHistory, reset: resetSession } = useSessionStore();
  const { moments, clearAll: clearMoments } = useMomentsStore();
  const { reset: resetMood } = useMoodStore();
  const { reset: resetInsights } = useInsightsStore();
  const reminderSettings = useRemindersStore((s) => s.settings);
  const setReminderSettings = useRemindersStore((s) => s.setSettings);
  const resetReminders = useRemindersStore((s) => s.reset);

  const [nameA, setNameA] = useState(partnerA.name);
  const [nameB, setNameB] = useState(partnerB.name);
  const [avatarA, setAvatarA] = useState(partnerA.avatar);
  const [avatarB, setAvatarB] = useState(partnerB.avatar);
  const [stage, setStage] = useState<RelationshipStage>(relationshipStage);
  const [saved, setSaved] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  async function updateReminderSchedule(next: Partial<typeof reminderSettings>) {
    const merged = { ...reminderSettings, ...next };
    setIsUpdatingReminder(true);
    setReminderMessage(null);

    try {
      if (!merged.enabled) {
        await cancelStreakReminder(reminderSettings.notificationId);
        setReminderSettings({ ...next, enabled: false, notificationId: null });
        setReminderMessage('Streak reminders are off.');
        return;
      }

      const notificationId = await scheduleStreakReminder({
        hour: merged.hour,
        minute: merged.minute,
        language: merged.language,
        partnerAName: partnerA.name,
        partnerBName: partnerB.name,
        streakCount,
        previousNotificationId: reminderSettings.notificationId,
      });

      if (!notificationId) {
        setReminderMessage(
          Platform.OS === 'web'
            ? 'Reminders are available on your iOS or Android device.'
            : 'Please allow notifications to turn on reminders.',
        );
        return;
      }

      setReminderSettings({ ...next, enabled: true, notificationId });
      setReminderMessage('Your gentle daily reminder is set.');
    } catch {
      setReminderMessage('We could not update reminders. Please try again.');
    } finally {
      setIsUpdatingReminder(false);
    }
  }

  function handleSave() {
    if (!nameA.trim() || !nameB.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePartners({ name: nameA.trim(), avatar: avatarA }, { name: nameB.trim(), avatar: avatarB });
    updateStage(stage);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (Platform.OS === 'web') {
      if (window.confirm('Reset all data? This cannot be undone.')) {
        resetPartners(); resetSession(); clearMoments(); resetMood(); resetInsights();
        cancelStreakReminder(reminderSettings.notificationId).catch(() => {});
        resetReminders();
        router.replace('/onboarding');
      }
    } else {
      Alert.alert(
        'Reset Onera',
        'This will clear all partners, saved moments, and session history. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              resetPartners(); resetSession(); clearMoments(); resetMood(); resetInsights();
              cancelStreakReminder(reminderSettings.notificationId).catch(() => {});
              resetReminders();
              router.replace('/onboarding');
            },
          },
        ]
      );
    }
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        </View>

        {/* Partner A */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Partner A</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarRow}>
              {AVATARS.slice(0, 6).map(emoji => (
                <Pressable
                  key={emoji}
                  onPress={() => setAvatarA(emoji)}
                  style={({ pressed }) => [
                    styles.avatarBtn,
                    avatarA === emoji && { backgroundColor: colors.primary + '30' },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={nameA}
              onChangeText={setNameA}
              placeholder="Partner A name"
              placeholderTextColor={colors.muted}
              maxLength={20}
            />
          </View>
        </View>

        {/* Partner B */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Partner B</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarRow}>
              {AVATARS.slice(6, 12).map(emoji => (
                <Pressable
                  key={emoji}
                  onPress={() => setAvatarB(emoji)}
                  style={({ pressed }) => [
                    styles.avatarBtn,
                    avatarB === emoji && { backgroundColor: colors.primary + '30' },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={nameB}
              onChangeText={setNameB}
              placeholder="Partner B name"
              placeholderTextColor={colors.muted}
              maxLength={20}
            />
          </View>
        </View>

        {/* Relationship Stage */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Relationship Stage</Text>
          <View style={styles.stageList}>
            {STAGES.map(s => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setStage(s.id);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [
                  styles.stageBtn,
                  {
                    backgroundColor: stage === s.id ? colors.primary + '18' : colors.surface,
                    borderColor: stage === s.id ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.stageText, { color: stage === s.id ? colors.primary : colors.foreground }]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Gentle reminders */}
        <View style={styles.section}>
          <View style={styles.reminderHeaderRow}>
            <View style={styles.reminderHeaderCopy}>
              <Text style={[styles.sectionLabel, { color: colors.muted, marginBottom: 6 }]}>Gentle reminders</Text>
              <Text style={[styles.reminderDescription, { color: colors.muted }]}>A quiet nudge to make a little time for each other.</Text>
            </View>
            <Switch
              value={reminderSettings.enabled}
              onValueChange={(enabled) => { void updateReminderSchedule({ enabled }); }}
              disabled={isUpdatingReminder}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={reminderSettings.enabled ? colors.primary : '#FAF7F4'}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={[styles.reminderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.reminderOptionLabel, { color: colors.foreground }]}>Reminder time</Text>
            <View style={styles.reminderOptionRow}>
              {REMINDER_TIMES.map((time) => {
                const selected = reminderSettings.hour === time.hour && reminderSettings.minute === time.minute;
                return (
                  <TouchableOpacity
                    key={time.label}
                    onPress={() => {
                      if (reminderSettings.enabled) {
                        void updateReminderSchedule({ hour: time.hour, minute: time.minute });
                      } else {
                        setReminderSettings({ hour: time.hour, minute: time.minute });
                      }
                    }}
                    disabled={isUpdatingReminder}
                    activeOpacity={0.75}
                    style={[
                      styles.reminderChoice,
                      {
                        backgroundColor: selected ? colors.primary + '18' : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: isUpdatingReminder ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.reminderChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{time.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.reminderOptionLabel, { color: colors.foreground, marginTop: 18 }]}>Reminder language</Text>
            <View style={styles.reminderOptionRow}>
              {[
                { value: 'en' as const, label: 'English' },
                { value: 'el' as const, label: 'Ελληνικά' },
              ].map((language) => {
                const selected = reminderSettings.language === language.value;
                return (
                  <TouchableOpacity
                    key={language.value}
                    onPress={() => {
                      if (reminderSettings.enabled) {
                        void updateReminderSchedule({ language: language.value });
                      } else {
                        setReminderSettings({ language: language.value });
                      }
                    }}
                    disabled={isUpdatingReminder}
                    activeOpacity={0.75}
                    style={[
                      styles.reminderChoice,
                      {
                        backgroundColor: selected ? colors.primary + '18' : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: isUpdatingReminder ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.reminderChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{language.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {reminderMessage && <Text style={[styles.reminderMessage, { color: colors.muted }]}>{reminderMessage}</Text>}
            <Text style={[styles.reminderFootnote, { color: colors.muted }]}>Reminders stay on this device and can be turned off anytime.</Text>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }]}
        >
          <Text style={[styles.saveBtnText, { color: '#FAF7F4' }]}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Your Journey</Text>
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{moments.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Moments saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>
                {sessionHistory.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Sessions done</Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Danger Zone</Text>
          <TouchableOpacity
            onPress={handleReset}
            activeOpacity={0.7}
            style={[styles.resetBtn, { borderColor: colors.error + '60' }]}
          >
            <Text style={[styles.resetText, { color: colors.error }]}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.about}>
          <Text style={[styles.aboutLogo, { color: colors.primary }]}>Onera</Text>
          <Text style={[styles.aboutTagline, { color: colors.muted }]}>Where connection unfolds.</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  reminderHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  reminderHeaderCopy: { flex: 1 },
  reminderDescription: { fontSize: 14, lineHeight: 20 },
  reminderCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  reminderOptionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  reminderOptionRow: { flexDirection: 'row', gap: 8 },
  reminderChoice: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 11, alignItems: 'center' },
  reminderChoiceText: { fontSize: 13, fontWeight: '600' },
  reminderMessage: { fontSize: 13, lineHeight: 18, marginTop: 16 },
  reminderFootnote: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  avatarRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 22 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  stageList: { gap: 8 },
  stageBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  stageText: { fontSize: 16, fontWeight: '500' },
  saveBtn: { borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginBottom: 32 },
  saveBtnText: { fontSize: 17, fontWeight: '600' },
  statsRow: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, textAlign: 'center' },
  statDivider: { width: 1, height: 40, marginHorizontal: 16 },
  resetBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetText: { fontSize: 16, fontWeight: '500' },
  about: { alignItems: 'center', paddingTop: 16, gap: 4 },
  aboutLogo: { fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  aboutTagline: { fontSize: 13 },
});
