import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button, InterestChip } from '@/components/ui';
import { useAuthStore } from '@/store';

const INTERESTS = [
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'startups', label: 'Startups', icon: '🚀' },
  { id: 'events', label: 'Events', icon: '🎉' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'cars', label: 'Cars', icon: '🏎️' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'anime', label: 'Anime', icon: '🎌' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'books', label: 'Books', icon: '📚' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { selectedInterests, setSelectedInterests } = useAuthStore();
  const [selected, setSelected] = useState<string[]>(selectedInterests);

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setSelectedInterests(selected);
    router.push('/(auth)/location');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.step}>2 of 3</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Select at least 3 interests to personalize your feed
        </Text>

        <View style={styles.selectedCount}>
          <Text style={styles.countText}>
            {selected.length} selected
          </Text>
          {selected.length >= 3 && (
            <View style={styles.readyBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.readyText}>Ready!</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.interestsGrid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
        >
          {INTERESTS.map((interest) => (
            <InterestChip
              key={interest.id}
              label={interest.label}
              icon={interest.icon}
              selected={selected.includes(interest.id)}
              onPress={() => toggleInterest(interest.id)}
              style={styles.chip}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selected.length < 3}
          size="large"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  step: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  countText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  interestsGrid: {
    flex: 1,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: SPACING.lg,
  },
  chip: {
    marginBottom: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
