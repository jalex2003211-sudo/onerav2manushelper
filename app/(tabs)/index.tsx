import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { usePartnersStore } from '@/store/partners.store';
import { useMoodStore, MOOD_META } from '@/store/mood.store';
import { useSessionStore, type SessionHistoryItem } from '@/store/session.store';
import { getDailyQuestion } from '@/lib/data/questions';
import { trpc } from '@/lib/trpc';

export default function HomeScreen() {
  const colors = useColors();
  const { partnerA, partnerB, isSetupComplete, streakCount, relationshipStage } = usePartnersStore();
  const { myMood, partnerMood } = useMoodStore();
  const sessionHistory = useSessionStore((s) => s.sessionHistory);


  // AI daily question (falls back to static if not authenticated)
  const [dailyQuestion, setDailyQuestion] = useState<string>(getDailyQuestion());

  const aiDailyQuery = trpc.ai.dailyQuestion.useQuery(
    { relationshipStage, streakCount },
    {
      enabled: isSetupComplete,
      staleTime: 1000 * 60 * 60 * 8, // 8 hours
    },
  );

  useEffect(() => {
    if (aiDailyQuery.data?.question) {
      setDailyQuestion(aiDailyQuery.data.question);
    }
  }, [aiDailyQuery.data]);

  const greeting = getGreeting();
  const sessionsThisWeek = getSessionsThisWeek(sessionHistory);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>{greeting}</Text>
            <Text style={[styles.coupleNames, { color: colors.foreground }]}>
              {partnerA.avatar} {partnerA.name} & {partnerB.avatar} {partnerB.name}
            </Text>
          </View>
          {/* Mood indicator */}
          {myMood && (
            <Pressable
              onPress={() => router.push('/mood' as never)}
              style={({ pressed }) => [
                styles.moodBadge,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.moodEmoji}>{MOOD_META[myMood.mood].emoji}</Text>
            </Pressable>
          )}
        </View>

        {/* Streak Widget */}
        <StreakWidget
          streakCount={streakCount}
          sessionsThisWeek={sessionsThisWeek}
          colors={colors}
        />

        {/* Daily Question Card */}
        <Pressable
          onPress={() => router.push('/daily')}
          style={({ pressed }) => [
            styles.dailyCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={styles.dailyCardHeader}>
            <Text style={[styles.dailyCardLabel, { color: colors.muted }]}>Today's question</Text>
            {aiDailyQuery.isLoading && (
              <Text style={[styles.aiLabel, { color: colors.primary }]}>✦ AI</Text>
            )}
          </View>
          <Text style={[styles.dailyCardQuestion, { color: colors.foreground }]}>
            {dailyQuestion}
          </Text>
          <Text style={[styles.dailyCardCta, { color: colors.primary }]}>
            Reflect together →
          </Text>
        </Pressable>

        {/* Partner Mood */}
        {partnerMood && partnerMood.visibleToPartner && (
          <View style={[styles.partnerMoodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.partnerMoodLabel, { color: colors.muted }]}>
              {partnerB.name} is feeling
            </Text>
            <View style={styles.partnerMoodRow}>
              <Text style={styles.partnerMoodEmoji}>{MOOD_META[partnerMood.mood].emoji}</Text>
              <Text style={[styles.partnerMoodText, { color: colors.foreground }]}>
                {MOOD_META[partnerMood.mood].label}
              </Text>
            </View>
          </View>
        )}

        {/* Session CTA */}
        <View style={styles.sessionSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Start a session</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            A guided conversation, just for you two.
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/session-start');
            }}
            style={({ pressed }) => [
              styles.sessionBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={[styles.sessionBtnText, { color: colors.background }]}>
              Begin a conversation
            </Text>
          </Pressable>
        </View>

        {/* Quick mood check-in */}
        {!myMood && (
          <Pressable
            onPress={() => router.push('/mood' as never)}
            style={({ pressed }) => [
              styles.moodCta,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.moodCtaText, { color: colors.muted }]}>
              How are you feeling today? →
            </Text>
          </Pressable>
        )}

        {/* Recent sessions */}
        {sessionHistory.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent sessions</Text>
            {sessionHistory.slice(0, 3).map((s) => (
              <View
                key={s.id}
                style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.recentDeck, { color: colors.foreground }]}>
                  {formatDeckName(s.deckId)}
                </Text>
                <Text style={[styles.recentMeta, { color: colors.muted }]}>
                  {s.questionCount} questions · {formatDate(s.completedAt)}
                  {s.connectionScore ? ` · ${s.connectionScore}/10` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Streak Widget ────────────────────────────────────────────────────────────

interface StreakWidgetProps {
  streakCount: number;
  sessionsThisWeek: number;
  colors: ReturnType<typeof useColors>;
}

function StreakWidget({ streakCount, sessionsThisWeek, colors }: StreakWidgetProps) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay(); // 0=Sun
  const adjustedToday = today === 0 ? 6 : today - 1;

  return (
    <View style={[styles.streakCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.streakHeader}>
        <View>
          <Text style={[styles.streakCount, { color: colors.primary }]}>{streakCount}</Text>
          <Text style={[styles.streakLabel, { color: colors.muted }]}>day streak</Text>
        </View>
        <View style={styles.streakRight}>
          <Text style={[styles.weekLabel, { color: colors.muted }]}>{sessionsThisWeek} this week</Text>
          <View style={styles.weekDots}>
            {days.map((d, i) => (
              <View key={i} style={styles.dayDot}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i <= adjustedToday && streakCount > 0
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                />
                <Text style={[styles.dayLabel, { color: colors.muted }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getSessionsThisWeek(history: SessionHistoryItem[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return history.filter((s) => new Date(s.completedAt).getTime() > weekAgo).length;
}

function formatDeckName(deckId: string): string {
  return deckId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  coupleNames: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  moodBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 22,
  },
  // Streak
  streakCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
  },
  streakLabel: {
    fontSize: 13,
  },
  streakRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  weekLabel: {
    fontSize: 13,
  },
  weekDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dayDot: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayLabel: {
    fontSize: 10,
  },
  // Daily card
  dailyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dailyCardQuestion: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
  },
  dailyCardCta: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Partner mood
  partnerMoodCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  partnerMoodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  partnerMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerMoodEmoji: {
    fontSize: 22,
  },
  partnerMoodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Session CTA
  sessionSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sessionBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sessionBtnText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Mood CTA
  moodCta: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  moodCtaText: {
    fontSize: 15,
  },
  // Recent sessions
  recentSection: {
    gap: 10,
  },
  recentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  recentDeck: {
    fontSize: 15,
    fontWeight: '600',
  },
  recentMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
