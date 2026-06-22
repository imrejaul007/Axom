import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const RECENT_SEARCHES = ['Biryani places', 'Tech meetups', 'Rooftop cafes', 'Weekend events'];
const TRENDING_SEARCHES = ['Nightlife in Koramangala', 'New restaurants', 'Free events', 'Food delivery'];

export default function SearchScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places, events, people..."
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {['All', 'Places', 'Events', 'People', 'Posts'].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, index === 0 && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Recent Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {RECENT_SEARCHES.map((item, index) => (
            <TouchableOpacity key={index} style={styles.searchItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.searchItemText}>{item}</Text>
              <Ionicons name="arrow-up" size={14} color={COLORS.textMuted} style={styles.searchArrow} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.trendingList}>
            {TRENDING_SEARCHES.map((item, index) => (
              <TouchableOpacity key={index} style={styles.trendingItem}>
                <Ionicons name="trending-up" size={16} color={COLORS.accent} />
                <Text style={styles.trendingText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested</Text>
          <View style={styles.suggestedList}>
            <TouchableOpacity style={styles.suggestedChip}>
              <Ionicons name="flame" size={16} color={COLORS.accent} />
              <Text style={styles.suggestedText}>🔥 Trending near you</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.suggestedChip}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.suggestedText}>Events this weekend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.suggestedChip}>
              <Ionicons name="restaurant" size={16} color={COLORS.error} />
              <Text style={styles.suggestedText}>Top rated restaurants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  filterButton: {
    padding: SPACING.xs,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
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
  },
  clearText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchItemText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  searchArrow: {
    transform: [{ rotate: '45deg' }],
  },
  trendingList: {},
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  trendingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  suggestedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  suggestedText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
});
