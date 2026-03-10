import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useSessionStore } from '@/store/session.store';
import { usePartnersStore } from '@/store/partners.store';

const SLIDER_WIDTH = Dimensions.get('window').width - 96;

export default function SessionEndScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ count?: string }>();
  const { partnerA, partnerB, incrementStreak } = usePartnersStore();
  const { sessionHistory, setConnectionScore } = useSessionStore();
  const lastSession = sessionHistory[0] ?? null;
  const colors = useColors();

  const count = lastSession?.questionCount ?? parseInt(params.count ?? '10', 10);
  const phasesCompleted = lastSession?.phasesCompleted ?? 4;
  const [connectionValue, setConnectionValue] = useState(7);
  const sliderAnim = useRef(new Animated.Value((7 / 10) * SLIDER_WIDTH)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const rawX = gestureState.moveX - 48;
        const clampedX = Math.max(0, Math.min(rawX, SLIDER_WIDTH));
        sliderAnim.setValue(clampedX);
        const val = Math.round((clampedX / SLIDER_WIDTH) * 10);
        setConnectionValue(Math.max(1, val));
      },
      onPanResponderRelease: () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const thumbPosition = sliderAnim.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  const fillWidth = sliderAnim.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  function getConnectionLabel(val: number): string {
    if (val <= 3) return 'Getting there';
    if (val <= 5) return 'Present with each other';
    if (val <= 7) return 'Warmly connected';
    if (val <= 9) return 'Deeply connected';
    return 'Completely in sync';
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} containerClassName="bg-background">
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconArea}>
          <Text style={styles.icon}>✦</Text>
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={[styles.title, { color: colors.foreground }]}>Session Complete</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {partnerA.name} & {partnerB.name}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{count}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Questions explored</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{phasesCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Phases completed</Text>
          </View>
        </View>

        {/* Connection Slider */}
        <View style={[styles.sliderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sliderQuestion, { color: colors.foreground }]}>
            How connected do you feel right now?
          </Text>
          <Text style={[styles.sliderLabel, { color: colors.primary }]}>
            {connectionValue}/10 — {getConnectionLabel(connectionValue)}
          </Text>

          <View style={styles.sliderTrack} {...panResponder.panHandlers}>
            <View style={[styles.sliderBg, { backgroundColor: colors.border }]} />
            <Animated.View
              style={[
                styles.sliderFill,
                { backgroundColor: colors.primary, width: fillWidth as any },
              ]}
            />
            <Animated.View
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                  transform: [{ translateX: thumbPosition }],
                },
              ]}
            />
          </View>

          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderEndLabel, { color: colors.muted }]}>Distant</Text>
            <Text style={[styles.sliderEndLabel, { color: colors.muted }]}>In sync</Text>
          </View>
        </View>

        {/* Closing message */}
        <Text style={[styles.closing, { color: colors.muted }]}>
          Thank you for sharing this moment together. Come back whenever you're ready for your next conversation.
        </Text>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setConnectionScore(connectionValue);
            incrementStreak();
            router.replace('/(tabs)');
          }}
          activeOpacity={0.85}
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: '#FAF7F4' }]}>Return Home</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
    gap: 24,
  },
  iconArea: { alignItems: 'center' },
  icon: { fontSize: 40, color: '#C4856A' },
  heading: { alignItems: 'center', gap: 4 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16 },
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 36, fontWeight: '700' },
  statLabel: { fontSize: 13, textAlign: 'center' },
  statDivider: { width: 1, height: 48, marginHorizontal: 16 },
  sliderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  sliderQuestion: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  sliderLabel: { fontSize: 14, fontWeight: '600' },
  sliderTrack: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    marginLeft: -12,
    top: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEndLabel: { fontSize: 12 },
  closing: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  ctaBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '600' },
});
