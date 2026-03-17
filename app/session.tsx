import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useCallback } from 'react';
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
    partnerACheckedIn,
    partnerBCheckedIn,
    advanceQuestion,
    checkIn,
    canAdvanceQuestion,
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

  const handleCheckIn = (partner: 'A' | 'B') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkIn(partner);
  };

  const handleNext = () => {
    if (!canAdvanceQuestion()) {
      // Show feedback that both partners must check in
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

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

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              endSession();
              router.replace('/(tabs)');
            }}
            activeOpacity={0.6}
            style={styles.exitBtn}
          >
            <Text style={[styles.exitText, { color: colors.muted }]}>End</Text>
          </TouchableOpacity>

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

                <TouchableOpacity
                  onPress={handleGetAIFollowUp}
                  disabled={isLoadingAI}
                  activeOpacity={isLoadingAI ? 1 : 0.6}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      opacity: isLoadingAI ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.muted }]}>
                    {isLoadingAI ? '✦ ...' : '✦ Go deeper'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Check-in section */}
        <View style={styles.checkInSection}>
          <Text style={[styles.checkInLabel, { color: colors.muted }]}>Both partners check in when ready</Text>
          <View style={styles.checkInRow}>
            <TouchableOpacity
              onPress={() => handleCheckIn('A')}
              activeOpacity={0.7}
              style={[
                styles.checkInBtn,
                {
                  backgroundColor: partnerACheckedIn ? phaseColor : colors.surface,
                  borderColor: partnerACheckedIn ? phaseColor : colors.border,
                },
              ]}
            >
              <Text style={styles.checkInEmoji}>{partnerA.avatar}</Text>
              <Text
                style={[
                  styles.checkInBtnText,
                  { color: partnerACheckedIn ? '#FAF7F4' : colors.foreground },
                ]}
              >
                {partnerACheckedIn ? '✓' : partnerA.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleCheckIn('B')}
              activeOpacity={0.7}
              style={[
                styles.checkInBtn,
                {
                  backgroundColor: partnerBCheckedIn ? phaseColor : colors.surface,
                  borderColor: partnerBCheckedIn ? phaseColor : colors.border,
                },
              ]}
            >
              <Text style={styles.checkInEmoji}>{partnerB.avatar}</Text>
              <Text
                style={[
                  styles.checkInBtnText,
                  { color: partnerBCheckedIn ? '#FAF7F4' : colors.foreground },
                ]}
              >
                {partnerBCheckedIn ? '✓' : partnerB.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={canAdvanceQuestion() ? 0.85 : 0.6}
            disabled={!canAdvanceQuestion()}
            style={[
              styles.nextBtn,
              {
                backgroundColor: canAdvanceQuestion() ? phaseColor : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.nextBtnText,
                { color: canAdvanceQuestion() ? '#FAF7F4' : colors.muted },
              ]}
            >
              {isLastQuestion ? 'Finish session' : 'Next question'}
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 169, 106, 0.08)',
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progress: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    paddingVertical: 12,
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  phaseStrip: {
    height: 4,
  },
  cardContent: {
    padding: 24,
    gap: 16,
  },
  deckLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  aiFollowUp: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  aiFollowUpLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  aiFollowUpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkInSection: {
    gap: 8,
  },
  checkInLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  checkInRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  checkInEmoji: {
    fontSize: 18,
  },
  checkInBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    gap: 12,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
