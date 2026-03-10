import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { usePartnersStore } from '@/store/partners.store';
import { useColors } from '@/hooks/use-colors';
import type { RelationshipStage } from '@/lib/data/questions';

const AVATARS = ['🌸', '🌿', '🌙', '☀️', '🌊', '🍃', '🌺', '🦋', '🌻', '🕊️', '🌹', '🌾'];

const STAGES: { id: RelationshipStage; label: string; description: string }[] = [
  { id: 'break-the-ice', label: 'Break the Ice', description: 'Just getting to know each other' },
  { id: 'dating', label: 'Dating', description: 'Building something meaningful' },
  { id: 'long-term', label: 'Long-Term', description: 'Deepening an established bond' },
];

export default function SetupScreen() {
  const router = useRouter();
  const completeSetup = usePartnersStore((s) => s.completeSetup);
  const colors = useColors();

  const [step, setStep] = useState<'partners' | 'stage'>('partners');
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [avatarA, setAvatarA] = useState('🌸');
  const [avatarB, setAvatarB] = useState('🌿');
  const [stage, setStage] = useState<RelationshipStage>('dating');

  const canContinue = nameA.trim().length > 0 && nameB.trim().length > 0;

  function handleContinue() {
    if (step === 'partners') {
      if (!canContinue) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep('stage');
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeSetup(
        { name: nameA.trim(), avatar: avatarA },
        { name: nameB.trim(), avatar: avatarB },
        stage,
      );
      router.replace('/(tabs)');
    }
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>Onera</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>Where connection unfolds.</Text>
        </View>

        {step === 'partners' ? (
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground }]}>Who's here tonight?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Create two simple profiles for your session.
            </Text>

            {/* Partner A */}
            <View style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.partnerLabel, { color: colors.muted }]}>Partner A</Text>
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
                placeholder="Enter a name"
                placeholderTextColor={colors.muted}
                value={nameA}
                onChangeText={setNameA}
                returnKeyType="next"
                maxLength={20}
              />
            </View>

            {/* Partner B */}
            <View style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.partnerLabel, { color: colors.muted }]}>Partner B</Text>
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
                placeholder="Enter a name"
                placeholderTextColor={colors.muted}
                value={nameB}
                onChangeText={setNameB}
                returnKeyType="done"
                maxLength={20}
              />
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground }]}>Where are you?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Choose the stage that best describes your relationship. This shapes the questions you'll explore.
            </Text>

            {STAGES.map(s => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setStage(s.id);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [
                  styles.stageCard,
                  {
                    backgroundColor: stage === s.id ? colors.primary + '18' : colors.surface,
                    borderColor: stage === s.id ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.stageLabel, { color: stage === s.id ? colors.primary : colors.foreground }]}>
                  {s.label}
                </Text>
                <Text style={[styles.stageDesc, { color: colors.muted }]}>{s.description}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={styles.footer}>
          {step === 'stage' && (
            <Pressable
              onPress={() => setStep('partners')}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.backText, { color: colors.muted }]}>← Back</Text>
            </Pressable>
          )}
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            style={[styles.ctaBtn, { backgroundColor: canContinue || step === 'stage' ? colors.primary : colors.border }]}
          >
            <Text style={[styles.ctaText, { color: '#FAF7F4' }]}>
              {step === 'partners' ? 'Continue' : "Let's Begin"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  logo: { fontSize: 32, fontWeight: '700', letterSpacing: 1 },
  tagline: { fontSize: 14, marginTop: 4, letterSpacing: 0.5 },
  content: { flex: 1, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 34, marginBottom: 4 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  partnerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  partnerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  avatarRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  stageCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 4,
  },
  stageLabel: { fontSize: 18, fontWeight: '600' },
  stageDesc: { fontSize: 14, lineHeight: 20 },
  footer: { paddingTop: 32, gap: 12 },
  backBtn: { alignSelf: 'center' },
  backText: { fontSize: 15 },
  ctaBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
});
