import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const { width: W } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '💜',
    title: 'Real people,\nreal intentions',
    subtitle: 'Rendez is exclusively for verified REZ users. Every profile is identity-checked — no fakes, no catfishing.',
    accent: '#7c3aed',
  },
  {
    id: '2',
    emoji: '🛡️',
    title: 'See trust,\nbefore you swipe',
    subtitle: 'Every profile shows verified meetups, response rate, and profile completeness. Know who\'s real before you say yes.',
    accent: '#3b82f6',
  },
  {
    id: '3',
    emoji: '🎁',
    title: 'Show intent,\nnot just interest',
    subtitle: 'Send a gift from a real REZ merchant to unlock conversation. It costs something — so it means something.',
    accent: '#f59e0b',
  },
  {
    id: '4',
    emoji: '🎊',
    title: 'Meet in real life,\nearn real rewards',
    subtitle: 'Book a date at a REZ-verified venue, scan in together, and both wallets get REZ coins. Connections that pay.',
    accent: '#10b981',
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      // R2-H10 FIX: scrollToIndex silently fails when FlatList hasn't measured its layout.
      // Wrap in setTimeout to ensure layout is measured first.
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
      }, 0);
      setActiveIndex(next);
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    await SecureStore.setItemAsync('rendez_onboarded', '1');
    onDone();
  };

  const handleSkip = () => handleDone();

  const current = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      {/* Skip */}
      {activeIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(s) => s.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: W }]}>
            <View style={[styles.emojiContainer, { backgroundColor: item.accent + '15' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
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
              { backgroundColor: i === activeIndex ? current.accent : '#ddd', width: i === activeIndex ? 24 : 8 },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: current.accent }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>
          {activeIndex < SLIDES.length - 1 ? 'Next →' : 'Get Started'}
        </Text>
      </TouchableOpacity>

      {activeIndex === SLIDES.length - 1 && (
        <Text style={styles.tos}>
          By continuing you agree to our{' '}
          <Text style={styles.tosLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.tosLink}>Privacy Policy</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    paddingBottom: 40,
  },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { color: '#bbb', fontSize: 14, fontWeight: '600' },

  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 20,
  },
  emojiContainer: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emoji: { fontSize: 70 },
  title: {
    fontSize: 28, fontWeight: '800', color: '#1a1a2e',
    textAlign: 'center', lineHeight: 36,
  },
  subtitle: {
    fontSize: 16, color: '#666', textAlign: 'center',
    lineHeight: 24, paddingHorizontal: 8,
  },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },

  cta: {
    width: W - 48, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  tos: { marginTop: 16, fontSize: 12, color: '#bbb', textAlign: 'center' },
  tosLink: { color: '#7c3aed', fontWeight: '600' },
});
