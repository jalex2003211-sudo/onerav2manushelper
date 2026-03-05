import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import { getDailyQuestion, getDecksForStage } from '@/lib/data/questions';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useApp();
  const colors = useColors();
  const dailyQuestion = getDailyQuestion();
  const recommendedDecks = getDecksForStage(state.relationshipStage);

  const greeting = getGreeting();
  const partnerNames = state.partnerA.name && state.partnerB.name
    ? `${state.partnerA.name} & ${state.partnerB.name}`
    : 'You two';

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.muted }]}>{greeting}</Text>
          <Text style={[styles.names, { color: colors.foreground }]}>{partnerNames}</Text>
          <View style={[styles.stagePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.stageText, { color: colors.muted }]}>
              {state.partnerA.avatar} {state.partnerB.avatar}
              {'  '}
              {state.relationshipStage === 'break-the-ice'
                ? 'Break the Ice'
                : state.relationshipStage === 'dating'
                ? 'Dating'
                : 'Long-Term'}
            </Text>
          </View>
        </View>

        {/* Daily Question */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Daily Onera Question</Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/daily');
            }}
            style={({ pressed }) => [
              styles.dailyCard,
              { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' },
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={[styles.dailyIcon, { color: colors.primary }]}>✦</Text>
            <Text style={[styles.dailyQuestion, { color: colors.foreground }]}>{dailyQuestion}</Text>
            <Text style={[styles.dailyAction, { color: colors.primary }]}>Explore together →</Text>
          </Pressable>
        </View>

        {/* Start Session */}
        <View style={styles.section}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/session-start');
            }}
            style={({ pressed }) => [
              styles.sessionBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
          >
            <Text style={[styles.sessionBtnText, { color: '#FAF7F4' }]}>Begin a Session</Text>
            <Text style={[styles.sessionBtnSub, { color: '#FAF7F4' + 'CC' }]}>8–12 guided questions together</Text>
          </Pressable>
        </View>

        {/* Recommended Decks */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Explore Decks</Text>
          <View style={styles.decksGrid}>
            {recommendedDecks.map(deck => (
              <Pressable
                key={deck.id}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/session-start', params: { deckId: deck.id } });
                }}
                style={({ pressed }) => [
                  styles.deckCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.deckDot, { backgroundColor: deck.color }]} />
                <Text style={[styles.deckName, { color: colors.foreground }]}>{deck.name}</Text>
                <Text style={[styles.deckDesc, { color: colors.muted }]} numberOfLines={2}>{deck.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Shared Moments Preview */}
        {state.savedMoments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Shared Moments</Text>
              <Pressable onPress={() => router.push('/(tabs)/moments')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            </View>
            <View style={[styles.momentPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.momentText, { color: colors.foreground }]} numberOfLines={3}>
                "{state.savedMoments[0].questionText}"
              </Text>
              <Text style={[styles.momentCount, { color: colors.muted }]}>
                {state.savedMoments.length} moment{state.savedMoments.length !== 1 ? 's' : ''} saved
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 28, gap: 4 },
  greeting: { fontSize: 14, fontWeight: '400', letterSpacing: 0.3 },
  names: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  stagePill: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
  },
  stageText: { fontSize: 13 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13 },
  dailyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  dailyIcon: { fontSize: 20 },
  dailyQuestion: { fontSize: 17, lineHeight: 26, fontWeight: '500' },
  dailyAction: { fontSize: 14, fontWeight: '500' },
  sessionBtn: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28,
    gap: 4,
  },
  sessionBtnText: { fontSize: 20, fontWeight: '700' },
  sessionBtnSub: { fontSize: 14 },
  decksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  deckCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  deckDot: { width: 10, height: 10, borderRadius: 5 },
  deckName: { fontSize: 15, fontWeight: '600' },
  deckDesc: { fontSize: 12, lineHeight: 18 },
  momentPreview: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  momentText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  momentCount: { fontSize: 12 },
});
