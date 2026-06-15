import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { TextInput, Card } from '@/components/ui';
import { logger } from '@/utils/logger';

const CATEGORIES = [
  { id: 'food', label: 'Food & Drinks', icon: '🍔', color: '#FF6B6B' },
  { id: 'events', label: 'Events', icon: '🎉', color: '#FF9F43' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙', color: '#9B59B6' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#3498DB' },
  { id: 'fitness', label: 'Fitness', icon: '💪', color: '#2ECC71' },
  { id: 'gaming', label: 'Gaming', icon: '🎮', color: '#E74C3C' },
  { id: 'study', label: 'Study Spots', icon: '📚', color: '#1ABC9C' },
  { id: 'arts', label: 'Arts', icon: '🎨', color: '#F39C12' },
];

const TRENDING = [
  { id: '1', title: 'Jazz Night at Bflat', subtitle: 'Indiranagar • Tonight 8PM', image: 'https://picsum.photos/200/150?random=10' },
  { id: '2', title: 'Food Festival', subtitle: 'MG Road • This Weekend', image: 'https://picsum.photos/200/150?random=11' },
  { id: '3', title: 'Tech Meetup', subtitle: 'Koramangala • Tomorrow', image: 'https://picsum.photos/200/150?random=12' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Ionicons name="scan-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <TouchableOpacity onPress={() => router.push('/search')}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <Text style={styles.searchPlaceholder}>Search places, events, people...</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {['Trending', 'Nearby', 'Open Now', 'Top Rated'].map((filter, index) => (
            <TouchableOpacity key={filter} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => logger.debug('Category pressed', { category: category.label })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingContainer}
          >
            {TRENDING.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.trendingCard}
                onPress={() => logger.debug('Trending item pressed', { title: item.title })}
              >
                <View style={styles.trendingImageContainer}>
                  <View style={styles.trendingImagePlaceholder}>
                    <Ionicons name="image" size={32} color={COLORS.textMuted} />
                  </View>
                  <View style={styles.trendingBadge}>
                    <Ionicons name="trending-up" size={12} color={COLORS.text} />
                    <Text style={styles.trendingBadgeText}>Hot</Text>
                  </View>
                </View>
                <Text style={styles.trendingTitle}>{item.title}</Text>
                <Text style={styles.trendingSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
          </View>
          <View style={styles.recentList}>
            {['Biryani places', 'Tech meetups', 'Rooftop cafes'].map((item, index) => (
              <TouchableOpacity key={index} style={styles.recentItem}>
                <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.recentText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
  },
  searchPlaceholder: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.text,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '23%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  trendingContainer: {
    paddingRight: SPACING.md,
  },
  trendingCard: {
    width: 160,
    marginRight: SPACING.md,
  },
  trendingImageContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  trendingImagePlaceholder: {
    width: 160,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  trendingBadgeText: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 2,
  },
  trendingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  trendingSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  recentList: {},
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  bottomPadding: {
    height: 100,
  },
});
