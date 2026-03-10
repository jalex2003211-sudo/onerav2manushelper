import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useSessionStore } from '@/store/session.store';
import { usePartnersStore } from '@/store/partners.store';
import { useMomentsStore } from '@/store/moments.store';
import { DECKS, type Phase } from '@/lib/data/questions';
import { trpc } from '@/lib/trpc';
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

export default function SessionScreen() {
  useKeepAwake();
  const colors = useColors();

  const {
    questions,
    currentIndex,
    currentPhase,
    turnOwner,
    deckId,
    aiFollowUp,
    isLoadingAI,
    isActive,
    advanceQuestion,
    switchTurn,
    setAIFollowUp,
    setLoadingAI,
    endSession,
  } = useSessionStore();

  const { partnerA, partnerB, relationshipStage } = usePartnersStore();
  const { addMoment, removeMoment, isSaved } = useMomentsStore();

  // Redirect if no active session
  useEffect(() => {
    if (!isActive || questions.length === 0) {
      router.replace('/(tabs)');
    }
  }, [isActive, questions.length]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;
  const phaseColor = PHASE_COLORS[currentPhase as Phase] ?? colors.primary;
  const deck = DECKS.find((d) => d.id === deckId);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const animateCardChange = useCallback((onComplete: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -SCREEN_WIDTH * 0.3, duration: 180, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onComplete();
      slideAnim.setValue(SCREEN_WIDTH * 0.3);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }, [slideAnim, opacityAnim]);

  // AI follow-up mutation
  const followUpMutation = trpc.ai.followUp.useMutation({
    onSuccess: (data) => {
      setAIFollowUp(data.question);
      setLoadingAI(false);
    },
    onError: () => {
      setLoadingAI(false);
    },
  });

  const handleGetAIFollowUp = () => {
    if (!currentQuestion || isLoadingAI) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingAI(true);
    setAIFollowUp(null);
    followUpMutation.mutate({
      originalQuestion: currentQuestion.text,
      phase: currentQuestion.phase,
      relationshipStage,
      deckId: currentQuestion.deck,
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      endSession();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/session-end');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateCardChange(() => {
      advanceQuestion();
    });
  };

  const handleSwitchTurn = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchTurn();
  };

  const handleToggleMoment = () => {
    if (!currentQuestion) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved(currentQuestion.id)) {
      removeMoment(currentQuestion.id);
    } else {
      addMoment({
        id: currentQuestion.id,
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        deckId: currentQuestion.deck,
      });
    }
  };

  if (!currentQuestion) return null;

  const momentSaved = isSaved(currentQuestion.id);
  const progress = (currentIndex + 1) / questions.length;
  const currentPartner = turnOwner === 'A' ? partnerA : partnerB;
  const otherPartner = turnOwner === 'A' ? partnerB : partnerA;

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              endSession();
              router.replace('/(tabs)');
            }}
            style={({ pressed }) => [styles.exitBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.exitText, { color: colors.muted }]}>End</Text>
          </Pressable>

          <View style={styles.phaseChip}>
            <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
            <Text style={[styles.phaseLabel, { color: phaseColor }]}>
              {PHASE_LABELS[currentPhase as Phase] ?? currentPhase}
            </Text>
          </View>

          <Text style={[styles.progress, { color: colors.muted }]}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: phaseColor, width: `${progress * 100}%` },
            ]}
          />
        </View>

        {/* Turn indicator */}
        <View style={styles.turnRow}>
          {([partnerA, partnerB] as const).map((partner, i) => {
            const isActiveTurn = (i === 0 && turnOwner === 'A') || (i === 1 && turnOwner === 'B');
            return (
              <View
                key={i}
                style={[
                  styles.turnChip,
                  {
                    backgroundColor: isActiveTurn ? phaseColor + '22' : colors.surface,
                    borderColor: isActiveTurn ? phaseColor : colors.border,
                  },
                ]}
              >
                <Text style={styles.turnEmoji}>{partner.avatar}</Text>
                <Text style={[styles.turnName, { color: isActiveTurn ? phaseColor : colors.muted }]}>
                  {partner.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Question card */}
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.questionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              { transform: [{ translateX: slideAnim }], opacity: opacityAnim },
            ]}
          >
            {/* Phase strip */}
            <View style={[styles.phaseStrip, { backgroundColor: phaseColor }]} />

            <View style={styles.cardContent}>
              {/* Deck label */}
              <Text style={[styles.deckLabel, { color: colors.muted }]}>
                {deck?.name ?? deckId}
              </Text>

              {/* Main question */}
              <Text style={[styles.questionText, { color: colors.foreground }]}>
                {currentQuestion.text}
              </Text>

              {/* Turn hint */}
              <Text style={[styles.turnHint, { color: colors.muted }]}>
                {currentPartner.avatar} {currentPartner.name} answers first · then {otherPartner.avatar} {otherPartner.name}
              </Text>

              {/* AI follow-up */}
              {aiFollowUp && (
                <View style={[styles.aiFollowUp, { backgroundColor: phaseColor + '15', borderColor: phaseColor + '40' }]}>
                  <Text style={[styles.aiFollowUpLabel, { color: phaseColor }]}>✦ AI Follow-up</Text>
                  <Text style={[styles.aiFollowUpText, { color: colors.foreground }]}>
                    {aiFollowUp}
                  </Text>
                </View>
              )}

              {/* Action row */}
              <View style={styles.cardActions}>
                <Pressable
                  onPress={handleToggleMoment}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: momentSaved ? phaseColor + '22' : colors.background,
                      borderColor: momentSaved ? phaseColor : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.actionBtnText, { color: momentSaved ? phaseColor : colors.muted }]}>
                    {momentSaved ? '♥ Saved' : '♡ Save'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleGetAIFollowUp}
                  disabled={isLoadingAI}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      opacity: pressed || isLoadingAI ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.muted }]}>
                    {isLoadingAI ? '✦ ...' : '✦ Go deeper'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <Pressable
            onPress={handleSwitchTurn}
            style={({ pressed }) => [
              styles.switchBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.switchBtnText, { color: colors.muted }]}>Switch turn</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: phaseColor,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={[styles.nextBtnText, { color: '#FAF7F4' }]}>
              {isLastQuestion ? 'Finish session' : 'Next question'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  exitBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  exitText: {
    fontSize: 15,
  },
  phaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progress: {
    fontSize: 14,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  turnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  turnChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  turnEmoji: {
    fontSize: 18,
  },
  turnName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
  },
  questionCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    minHeight: 300,
  },
  phaseStrip: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 24,
    gap: 16,
    flex: 1,
  },
  deckLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 32,
    flex: 1,
  },
  turnHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiFollowUp: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  aiFollowUpLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  aiFollowUpText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomControls: {
    flexDirection: 'row',
    gap: 10,
  },
  switchBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
  nextBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
