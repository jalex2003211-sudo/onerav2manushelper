import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import { DECKS, getDecksForStage, type DeckId } from '@/lib/data/questions';

export default function SessionStartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId?: string }>();
  const { state } = useApp();
  const colors = useColors();

  const recommended = getDecksForStage(state.relationshipStage);
  const defaultDeck = (params.deckId as DeckId) || recommended[0]?.id || 'deep-connection';
  const [selectedDeck, setSelectedDeck] = useState<DeckId>(defaultDeck);

  const deck = DECKS.find(d => d.id === selectedDeck)!;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Close */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.closeText, { color: colors.muted }]}>✕</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Choose a Deck</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Select the theme for your conversation tonight.
          </Text>
        </View>

        {/* Deck List */}
        <View style={styles.deckList}>
          {DECKS.map(d => {
            const isRecommended = recommended.some(r => r.id === d.id);
            const isSelected = selectedDeck === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => {
                  setSelectedDeck(d.id);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [
                  styles.deckCard,
                  {
                    backgroundColor: isSelected ? colors.primary + '14' : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.deckRow}>
                  <View style={[styles.deckDot, { backgroundColor: d.color }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.deckTitleRow}>
                      <Text style={[styles.deckName, { color: isSelected ? colors.primary : colors.foreground }]}>
                        {d.name}
                      </Text>
                      {isRecommended && (
                        <View style={[styles.recBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.recText, { color: colors.primary }]}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.deckDesc, { color: colors.muted }]}>{d.description}</Text>
                  </View>
                  {isSelected && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Session Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>About this session</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            You'll explore 10 questions together, moving through four emotional phases: Warm Up, Explore, Deep, and Reflection. Take turns answering and listen with intention.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace({ pathname: '/session', params: { deckId: selectedDeck } });
          }}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
        >
          <Text style={[styles.ctaText, { color: '#FAF7F4' }]}>Begin Session</Text>
          <Text style={[styles.ctaSub, { color: '#FAF7F4CC' }]}>{deck.name}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', paddingTop: 16, paddingBottom: 8, paddingLeft: 16 },
  closeText: { fontSize: 20 },
  header: { paddingBottom: 24, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 34 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  deckList: { gap: 12, marginBottom: 24 },
  deckCard: { borderRadius: 20, borderWidth: 1.5, padding: 20 },
  deckRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  deckDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  deckTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  deckName: { fontSize: 17, fontWeight: '600' },
  deckDesc: { fontSize: 13, lineHeight: 20 },
  recBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  recText: { fontSize: 11, fontWeight: '600' },
  checkmark: { fontSize: 18, fontWeight: '700' },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 28, gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: '600' },
  infoText: { fontSize: 14, lineHeight: 22 },
  ctaBtn: { borderRadius: 20, paddingVertical: 20, alignItems: 'center', gap: 4 },
  ctaText: { fontSize: 18, fontWeight: '700' },
  ctaSub: { fontSize: 13 },
});
