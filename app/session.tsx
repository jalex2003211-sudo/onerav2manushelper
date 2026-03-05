import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import { buildSession, DECKS, type DeckId, type Phase, type Question } from '@/lib/data/questions';
import { useKeepAwake } from 'expo-keep-awake';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

const PHASE_LABELS: Record<Phase, string> = {
  warmup: 'Warm Up',
  explore: 'Explore',
  deep: 'Deep',
  reflection: 'Reflection',
};

const PHASE_COLORS: Record<Phase, string> = {
  warmup: '#D4A96A',
  explore: '#8B9E7A',
  deep: '#C4856A',
  reflection: '#7A8FA0',
};

function getPhaseIndex(phase: Phase): number {
  return ['warmup', 'explore', 'deep', 'reflection'].indexOf(phase);
}

export default function SessionScreen() {
  useKeepAwake();
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId?: string }>();
  const { state, saveMoment, isMomentSaved, recordSession } = useApp();
  const colors = useColors();

  const deckId = (params.deckId as DeckId) || 'deep-connection';
  const deck = DECKS.find(d => d.id === deckId)!;

  const [questions] = useState<Question[]>(() => buildSession(deckId, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [turnPhase, setTurnPhase] = useState<'A' | 'B'>('A');
  const [savedThisCard, setSavedThisCard] = useState(false);
  const [longPressAnim] = useState(new Animated.Value(1));

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];
  const currentPhase = currentQuestion?.phase ?? 'warmup';
  const phaseColor = PHASE_COLORS[currentPhase];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const currentPartner = turnPhase === 'A' ? state.partnerA : state.partnerB;
  const otherPartner = turnPhase === 'A' ? state.partnerB : state.partnerA;

  const revealCard = useCallback(() => {
    if (isRevealed) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRevealed(true);
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRevealed, flipAnim]);

  const advanceQuestion = useCallback(() => {
    if (!isRevealed) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isLastQuestion) {
      recordSession();
      router.replace({ pathname: '/session-end', params: { count: String(totalQuestions) } });
      return;
    }

    // Slide out
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
      setSavedThisCard(false);
      // Switch turns
      setTurnPhase(prev => (prev === 'A' ? 'B' : 'A'));
      flipAnim.setValue(0);
      slideAnim.setValue(SCREEN_WIDTH * 0.3);
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, [isRevealed, isLastQuestion, slideAnim, flipAnim, recordSession, router, totalQuestions]);

  const handleLongPress = useCallback(() => {
    if (!currentQuestion) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveMoment(currentQuestion);
    setSavedThisCard(true);
    Animated.sequence([
      Animated.timing(longPressAnim, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.timing(longPressAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [currentQuestion, saveMoment, longPressAnim]);

  const cardOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 1] });
  const cardScale = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.97, 0.95, 1] });

  if (!currentQuestion) return null;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} containerClassName="bg-background">
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.exitText, { color: colors.muted }]}>✕</Text>
          </Pressable>

          <View style={styles.progressContainer}>
            {questions.map((q, i) => (
              <View
                key={q.id}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i < currentIndex
                      ? phaseColor
                      : i === currentIndex
                      ? phaseColor
                      : colors.border,
                    opacity: i === currentIndex ? 1 : i < currentIndex ? 0.6 : 0.3,
                    width: i === currentIndex ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.counter, { color: colors.muted }]}>
            {currentIndex + 1}/{totalQuestions}
          </Text>
        </View>

        {/* Phase Indicator */}
        <View style={styles.phaseRow}>
          {(['warmup', 'explore', 'deep', 'reflection'] as Phase[]).map((p, i) => (
            <View
              key={p}
              style={[
                styles.phaseChip,
                {
                  backgroundColor: p === currentPhase ? phaseColor + '25' : 'transparent',
                  borderColor: p === currentPhase ? phaseColor : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.phaseText,
                  { color: p === currentPhase ? phaseColor : colors.muted + '80' },
                ]}
              >
                {PHASE_LABELS[p]}
              </Text>
            </View>
          ))}
        </View>

        {/* Card Area */}
        <View style={styles.cardArea}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: isRevealed ? phaseColor + '40' : colors.border,
                transform: [{ translateX: slideAnim }, { scale: Animated.multiply(cardScale, longPressAnim) }],
                opacity: cardOpacity,
                shadowColor: phaseColor,
              },
            ]}
          >
            {/* Phase strip */}
            <View style={[styles.phaseStrip, { backgroundColor: phaseColor }]} />

            {!isRevealed ? (
              <Pressable
                onPress={revealCard}
                style={styles.cardInner}
              >
                <Text style={[styles.deckLabel, { color: colors.muted }]}>{deck.name}</Text>
                <Text style={[styles.tapHint, { color: colors.muted }]}>Tap to reveal</Text>
                <Text style={[styles.tapIcon, { color: phaseColor }]}>✦</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={advanceQuestion}
                onLongPress={handleLongPress}
                delayLongPress={500}
                style={styles.cardInner}
              >
                <Text style={[styles.phaseLabel, { color: phaseColor }]}>{PHASE_LABELS[currentPhase]}</Text>
                <Text style={[styles.questionText, { color: colors.foreground }]}>
                  {currentQuestion.text}
                </Text>
                {savedThisCard && (
                  <View style={[styles.savedBadge, { backgroundColor: phaseColor + '20' }]}>
                    <Text style={[styles.savedText, { color: phaseColor }]}>♥ Saved to Moments</Text>
                  </View>
                )}
                <Text style={[styles.swipeHint, { color: colors.muted }]}>
                  {isLastQuestion ? 'Tap to finish session' : 'Tap to continue · Hold to save'}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </View>

        {/* Turn Indicator */}
        <View style={[styles.turnBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {!isRevealed ? (
            <Text style={[styles.turnText, { color: colors.foreground }]}>
              <Text style={{ color: phaseColor }}>{currentPartner.avatar} {currentPartner.name}</Text>
              {'  '}—  tap the card to begin
            </Text>
          ) : (
            <View style={styles.turnContent}>
              <Text style={[styles.turnText, { color: colors.foreground }]}>
                <Text style={{ color: phaseColor }}>{currentPartner.avatar} {currentPartner.name}</Text>
                {'  '}answers first
              </Text>
              <Text style={[styles.turnSub, { color: colors.muted }]}>
                Then ask {otherPartner.avatar} {otherPartner.name} the same question
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  exitBtn: { padding: 4 },
  exitText: { fontSize: 18 },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  counter: { fontSize: 13, fontWeight: '500', minWidth: 32, textAlign: 'right' },
  phaseRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  phaseChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phaseText: { fontSize: 12, fontWeight: '500' },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 320,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  phaseStrip: {
    height: 4,
    width: '100%',
  },
  cardInner: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 316,
  },
  deckLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  tapHint: { fontSize: 16, fontWeight: '400' },
  tapIcon: { fontSize: 28 },
  phaseLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  questionText: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '500',
    textAlign: 'center',
  },
  savedBadge: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  savedText: { fontSize: 13, fontWeight: '500' },
  swipeHint: { fontSize: 12, marginTop: 8 },
  turnBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
  },
  turnContent: { gap: 4 },
  turnText: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  turnSub: { fontSize: 13, lineHeight: 20 },
});
