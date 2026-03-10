import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useMoodStore, MOOD_META, type MoodLabel } from '@/store/mood.store';

const MOODS: MoodLabel[] = [
  'calm', 'connected', 'grateful', 'playful',
  'tender', 'tired', 'anxious', 'distant',
];

export default function MoodScreen() {
  const colors = useColors();
  const { setMyMood, myMood } = useMoodStore();
  const [selected, setSelected] = useState<MoodLabel | null>(myMood?.mood ?? null);
  const [visibleToPartner, setVisibleToPartner] = useState(myMood?.visibleToPartner ?? false);

  const handleSave = () => {
    if (!selected) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMyMood(selected, visibleToPartner);
    router.back();
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.closeBtnText, { color: colors.muted }]}>✕</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>How are you feeling?</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            A quick check-in helps set the tone for your session.
          </Text>
        </View>

        {/* Mood grid */}
        <View style={styles.moodGrid}>
          {MOODS.map((mood) => {
            const meta = MOOD_META[mood];
            const isSelected = selected === mood;
            return (
              <Pressable
                key={mood}
                onPress={() => {
                  setSelected(mood);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [
                  styles.moodBtn,
                  {
                    backgroundColor: isSelected ? meta.color + '22' : colors.surface,
                    borderColor: isSelected ? meta.color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.moodEmoji}>{meta.emoji}</Text>
                <Text style={[styles.moodLabel, { color: isSelected ? meta.color : colors.muted }]}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Visibility toggle */}
        {selected && (
          <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                Share with partner
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.muted }]}>
                They'll see your mood on their home screen.
              </Text>
            </View>
            <Switch
              value={visibleToPartner}
              onValueChange={setVisibleToPartner}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!selected}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: selected ? colors.primary : colors.border }]}
        >
          <Text style={[styles.saveBtnText, { color: selected ? colors.background : colors.muted }]}>
            Save check-in
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodBtn: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
