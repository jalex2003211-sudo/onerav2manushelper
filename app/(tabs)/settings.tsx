import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import type { RelationshipStage } from '@/lib/data/questions';

const AVATARS = ['🌸', '🌿', '🌙', '☀️', '🌊', '🍃', '🌺', '🦋', '🌻', '🕊️', '🌹', '🌾'];

const STAGES: { id: RelationshipStage; label: string }[] = [
  { id: 'break-the-ice', label: 'Break the Ice' },
  { id: 'dating', label: 'Dating' },
  { id: 'long-term', label: 'Long-Term' },
];

export default function SettingsScreen() {
  const { state, updatePartners, updateStage, reset } = useApp();
  const colors = useColors();

  const [nameA, setNameA] = useState(state.partnerA.name);
  const [nameB, setNameB] = useState(state.partnerB.name);
  const [avatarA, setAvatarA] = useState(state.partnerA.avatar);
  const [avatarB, setAvatarB] = useState(state.partnerB.avatar);
  const [stage, setStage] = useState<RelationshipStage>(state.relationshipStage);
  const [saved, setSaved] = useState(false);

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
        reset();
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
              reset();
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

        {/* Save */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? colors.success : colors.primary },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: '#FAF7F4' }]}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Your Journey</Text>
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{state.savedMoments.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Moments saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>
                {state.lastSessionDate ? '✓' : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Last session</Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Danger Zone</Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.resetBtn,
              { borderColor: colors.error + '60' },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.resetText, { color: colors.error }]}>Reset All Data</Text>
          </Pressable>
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
