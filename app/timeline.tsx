import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useSessionStore, type SessionHistoryItem } from '@/store/session.store';

const DECK_COLORS: Record<string, string> = {
  'deep-connection': '#C4856A',
  'playful-curiosity': '#D4A96A',
  'gratitude-appreciation': '#8B9E7A',
  'conflict-resolution': '#7A8FA0',
  'future-dreams': '#A07090',
};

function formatDeckName(deckId: string): string {
  return deckId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function TimelineScreen() {
  const colors = useColors();
  const sessionHistory = useSessionStore((s) => s.sessionHistory);

  const renderItem = ({ item, index }: { item: SessionHistoryItem; index: number }) => {
    const deckColor = DECK_COLORS[item.deckId] ?? colors.primary;
    return (
      <View style={styles.itemRow}>
        {/* Timeline line */}
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: deckColor }]} />
          {index < sessionHistory.length - 1 && (
            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
          )}
        </View>

        {/* Card */}
        <View
          style={[
            styles.sessionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.deckName, { color: deckColor }]}>
              {formatDeckName(item.deckId)}
            </Text>
            {item.connectionScore !== null && (
              <View style={[styles.scoreBadge, { backgroundColor: deckColor + '20' }]}>
                <Text style={[styles.scoreText, { color: deckColor }]}>
                  {item.connectionScore}/10
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDate, { color: colors.muted }]}>
            {formatDate(item.completedAt)} · {formatTime(item.completedAt)}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.muted }]}>
            {item.questionCount} questions
            {item.savedMomentIds.length > 0
              ? ` · ${item.savedMomentIds.length} moment${item.savedMomentIds.length > 1 ? 's' : ''} saved`
              : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: colors.muted }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Session Timeline</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Your journey together, session by session.
          </Text>
        </View>

        {sessionHistory.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No sessions yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Complete your first session to start building your timeline.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sessionHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 6,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
    paddingTop: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 24,
  },
  sessionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckName: {
    fontSize: 15,
    fontWeight: '600',
  },
  scoreBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 13,
  },
  cardMeta: {
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
