import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { usePartnersStore } from '@/store/partners.store';
import { getDailyQuestion } from '@/lib/data/questions';

export default function DailyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { partnerA, partnerB } = usePartnersStore();
  const question = getDailyQuestion();

  const [turn, setTurn] = useState<'A' | 'B' | 'done'>('A');

  const currentPartner = turn === 'A' ? partnerA : partnerB;
  const otherPartner = turn === 'A' ? partnerB : partnerA;

  function handleNext() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (turn === 'A') setTurn('B');
    else setTurn('done');
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} containerClassName="bg-background">
      <View style={styles.container}>
        {/* Close */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.closeText, { color: colors.muted }]}>✕</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.muted }]}>Daily Onera Question</Text>
          <Text style={[styles.date, { color: colors.muted }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardIcon, { color: colors.primary }]}>✦</Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{question}</Text>
        </View>

        {/* Turn Indicator */}
        {turn !== 'done' ? (
          <View style={[styles.turnCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.turnText, { color: colors.foreground }]}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {currentPartner.avatar} {currentPartner.name}
              </Text>
              {' '}— share your answer
            </Text>
            {turn === 'A' && (
              <Text style={[styles.turnSub, { color: colors.muted }]}>
                Then {otherPartner.avatar} {otherPartner.name} will share theirs
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.doneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.doneText, { color: colors.foreground }]}>
              {partnerA.avatar} {partnerA.name} & {partnerB.avatar} {partnerB.name}
            </Text>
            <Text style={[styles.doneSub, { color: colors.muted }]}>
              Thank you for sharing this moment together.
            </Text>
          </View>
        )}

        {/* CTA */}
        {turn !== 'done' ? (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={[styles.ctaText, { color: '#FAF7F4' }]}>
              {turn === 'A' ? `${otherPartner.name}'s turn →` : 'We both answered'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={[styles.ctaText, { color: '#FAF7F4' }]}>Done</Text>
          </Pressable>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  closeBtn: { alignSelf: 'flex-end', paddingTop: 16, paddingLeft: 16 },
  closeText: { fontSize: 20 },
  header: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  date: { fontSize: 15 },
  card: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    padding: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  cardIcon: { fontSize: 32 },
  questionText: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '500',
    textAlign: 'center',
  },
  turnCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 6,
  },
  turnText: { fontSize: 16, lineHeight: 24 },
  turnSub: { fontSize: 13, lineHeight: 20 },
  doneCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  doneText: { fontSize: 16, fontWeight: '600' },
  doneSub: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  ctaBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '600' },
});
