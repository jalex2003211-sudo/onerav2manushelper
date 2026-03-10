import React from 'react';
import { View, Text, FlatList, Pressable, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { DECKS } from '@/lib/data/questions';
import { useMomentsStore } from '@/store/moments.store';
import type { SavedMoment } from '@/store/moments.store';

function MomentCard({ moment, onRemove }: { moment: SavedMoment; onRemove: () => void }) {
  const colors = useColors();
  const deck = DECKS.find(d => d.id === moment.deckId);
  const date = new Date(moment.savedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.deckRow}>
          {deck && <View style={[styles.deckDot, { backgroundColor: deck.color }]} />}
          <Text style={[styles.deckName, { color: colors.muted }]}>{deck?.name ?? 'Saved'}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.date, { color: colors.muted }]}>{date}</Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRemove();
            }}
            activeOpacity={0.5}
            style={styles.removeBtn}
          >
            <Text style={[styles.removeText, { color: colors.muted }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.questionText, { color: colors.foreground }]}>
        "{moment.questionText}"
      </Text>
    </View>
  );
}

export default function MomentsScreen() {
  const { moments, removeMoment } = useMomentsStore();
  const colors = useColors();

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Shared Moments</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Questions that meant something to you both.
        </Text>
      </View>

      {moments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.muted }]}>♥</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing saved yet</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            During a session, hold a card to save meaningful questions here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={moments}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MomentCard moment={item} onRemove={() => removeMoment(item.id)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 20, gap: 4 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deckRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deckDot: { width: 8, height: 8, borderRadius: 4 },
  deckName: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { fontSize: 12 },
  removeBtn: { padding: 4 },
  removeText: { fontSize: 14 },
  questionText: { fontSize: 16, lineHeight: 26, fontStyle: 'italic' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptyText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
