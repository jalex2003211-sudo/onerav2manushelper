import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useInsightsStore } from '@/store/insights.store';
import { usePartnersStore } from '@/store/partners.store';
import { useSessionStore } from '@/store/session.store';
import { trpc } from '@/lib/trpc';

export default function InsightsScreen() {
  const colors = useColors();
  const { insights, addInsight } = useInsightsStore();
  const { partnerA, partnerB, streakCount } = usePartnersStore();
  const sessionHistory = useSessionStore((s) => s.sessionHistory);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsightMutation = trpc.ai.weeklyInsight.useMutation({
    onSuccess: (data) => {
      addInsight({
        id: `insight_${Date.now()}`,
        insightType: 'weekly',
        content: data.insight,
        themes: data.themes,
        generatedAt: new Date().toISOString(),
      });
      setIsGenerating(false);
    },
    onError: (err) => {
      setError(err.message);
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    if (sessionHistory.length === 0) {
      setError('Complete at least one session to generate insights.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const recentDecks = sessionHistory.slice(0, 5).map((s) => s.deckId);
    const avgScore =
      sessionHistory.filter((s) => s.connectionScore).reduce((acc, s) => acc + (s.connectionScore ?? 0), 0) /
      (sessionHistory.filter((s) => s.connectionScore).length || 1);

    generateInsightMutation.mutate({
      sessionCount: sessionHistory.length,
      streakCount,
      recentDecks,
      avgConnectionScore: Math.round(avgScore),
      partnerAName: partnerA.name,
      partnerBName: partnerB.name,
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.muted }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Relationship Insights</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            AI-generated reflections based on your sessions together.
          </Text>
        </View>

        {/* Stats summary */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statRow}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{sessionHistory.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Sessions completed</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{streakCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Day streak</Text>
          </View>
        </View>

        {/* Generate button */}
        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.generateBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isGenerating ? 0.7 : 1,
            },
          ]}
        >
          {isGenerating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color={colors.background} size="small" />
              <Text style={[styles.generateBtnText, { color: colors.background }]}>
                Generating insight...
              </Text>
            </View>
          ) : (
            <Text style={[styles.generateBtnText, { color: colors.background }]}>
              ✦ Generate weekly insight
            </Text>
          )}
        </Pressable>

        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Insights list */}
        {insights.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✦</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No insights yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Complete a few sessions and generate your first weekly insight.
            </Text>
          </View>
        ) : (
          <View style={styles.insightsList}>
            {insights.map((insight) => (
              <View
                key={insight.id}
                style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.insightHeader}>
                  <Text style={[styles.insightType, { color: colors.primary }]}>
                    {insight.insightType === 'weekly' ? '✦ Weekly' : '✦ Monthly'} Insight
                  </Text>
                  <Text style={[styles.insightDate, { color: colors.muted }]}>
                    {new Date(insight.generatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={[styles.insightContent, { color: colors.foreground }]}>
                  {insight.content}
                </Text>
                {insight.themes && insight.themes.length > 0 && (
                  <View style={styles.themesRow}>
                    {insight.themes.map((theme) => (
                      <View
                        key={theme}
                        style={[styles.themeChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                      >
                        <Text style={[styles.themeText, { color: colors.primary }]}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },
  header: {
    gap: 8,
    paddingTop: 8,
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
  statsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRow: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  generateBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    color: '#C4856A',
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
  insightsList: {
    gap: 14,
  },
  insightCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightType: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  insightDate: {
    fontSize: 12,
  },
  insightContent: {
    fontSize: 15,
    lineHeight: 24,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
