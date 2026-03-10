import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🌿',
    title: 'A new kind of\nconversation',
    subtitle: 'Guided questions that help you and your partner go deeper — one evening at a time.',
  },
  {
    id: '2',
    emoji: '✨',
    title: 'Questions that\nactually matter',
    subtitle: 'Five themed decks, from playful to profound. AI that adapts to where you are.',
  },
  {
    id: '3',
    emoji: '🌸',
    title: 'Build something\ntogether',
    subtitle: 'Track your streak, save meaningful moments, and watch your connection deepen over time.',
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
  ).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/setup');
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.background }]}>
              {isLast ? 'Get started' : 'Continue'}
            </Text>
          </Pressable>

          {isLast && (
            <Pressable
              onPress={() => router.replace('/setup')}
              style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>Skip intro</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
  },
});
