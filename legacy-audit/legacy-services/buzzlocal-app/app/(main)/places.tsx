/**
 * Places - Discover nearby places
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface Place {
  id: string;
  name: string;
  type: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  vibeScore: number;
  trending: boolean;
}

const PLACE_TYPES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'restaurant', label: 'Food', icon: 'restaurant' },
  { id: 'cafe', label: 'Cafes', icon: 'cafe' },
  { id: 'gym', label: 'Fitness', icon: 'fitness' },
  { id: 'park', label: 'Parks', icon: 'leaf' },
  { id: 'shopping', label: 'Shopping', icon: 'cart' },
  { id: 'healthcare', label: 'Health', icon: 'medical' },
];

const MOCK_PLACES: Place[] = [
  { id: '1', name: 'Meghana Foods', type: 'Restaurant', category: 'restaurant', rating: 4.5, reviewCount: 2340, distance: '0.5 km', vibeScore: 92, trending: true },
  { id: '2', name: 'Starbucks', type: 'Cafe', category: 'cafe', rating: 4.2, reviewCount: 890, distance: '0.3 km', vibeScore: 88, trending: true },
  { id: '3', name: 'Cult.fit', type: 'Gym', category: 'gym', rating: 4.6, reviewCount: 567, distance: '0.8 km', vibeScore: 95, trending: false },
  { id: '4', name: 'Cubbon Park', type: 'Park', category: 'park', rating: 4.7, reviewCount: 4500, distance: '1.2 km', vibeScore: 98, trending: true },
  { id: '5', name: 'Phoenix Marketcity', type: 'Mall', category: 'shopping', rating: 4.3, reviewCount: 3200, distance: '2.5 km', vibeScore: 85, trending: false },
  { id: '6', name: 'Fortis Hospital', type: 'Hospital', category: 'healthcare', rating: 4.4, reviewCount: 1200, distance: '1.8 km', vibeScore: 90, trending: false },
  { id: '7', name: 'Toit Brewery', type: 'Bar', category: 'restaurant', rating: 4.5, reviewCount: 3100, distance: '0.9 km', vibeScore: 96, trending: true },
  { id: '8', name: 'Yoga Studio', type: 'Yoga', category: 'gym', rating: 4.8, reviewCount: 340, distance: '0.6 km', vibeScore: 94, trending: false },
];

export default function PlacesScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'vibe'>('vibe');

  const filteredPlaces = places.filter((place) => {
    const matchesType = selectedType === 'all' || place.category === selectedType;
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'distance') {
      return parseFloat(a.distance) - parseFloat(b.distance);
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return b.vibeScore - a.vibeScore;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handlePlacePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  const getVibeColor = (score: number) => {
    if (score >= 90) return COLORS.success;
    if (score >= 75) return COLORS.warning;
    return COLORS.error;
  };

  const renderPlace = ({ item }: { item: Place }) => {
    return (
      <TouchableOpacity style={styles.placeCard} onPress={() => handlePlacePress(item)}>
        <View style={styles.placeIcon}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.placeInfo}>
          <View style={styles.placeHeader}>
            <Text style={styles.placeName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.trending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={12} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.placeType}>{item.type}</Text>
          <View style={styles.placeMeta}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount})</Text>
            </View>
            <Text style={styles.distance}>{item.distance}</Text>
          </View>
        </View>
        <View style={styles.vibeScore}>
          <Text style={[styles.vibeNumber, { color: getVibeColor(item.vibeScore) }]}>
            {item.vibeScore}
          </Text>
          <Text style={styles.vibeLabel}>vibe</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Places</Text>
        <TouchableOpacity>
          <Ionicons name="options" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {(['vibe', 'rating', 'distance'] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
            onPress={() => setSortBy(sort)}
          >
            <Ionicons
              name={sort === 'distance' ? 'navigate' : sort === 'rating' ? 'star' : 'bulb'}
              size={14}
              color={sortBy === sort ? '#fff' : COLORS.textSecondary}
            />
            <Text style={[styles.sortChipText, sortBy === sort && styles.sortChipTextActive]}>
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filters */}
      <View style={styles.typeContainer}>
        <FlatList
          horizontal
          data={PLACE_TYPES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.typeChip,
                selectedType === item.id && styles.typeChipActive,
              ]}
              onPress={() => setSelectedType(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={selectedType === item.id ? '#fff' : COLORS.primary}
              />
              <Text
                style={[
                  styles.typeChipText,
                  selectedType === item.id && styles.typeChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.typeList}
        />
      </View>

      {/* Places List */}
      <FlatList
        data={filteredPlaces}
        renderItem={renderPlace}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Places Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  sortChipTextActive: {
    color: '#fff',
  },
  typeContainer: {
    marginBottom: SPACING.md,
  },
  typeList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  typeChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  placeIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  placeInfo: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  placeName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  trendingBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  placeType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  placeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  distance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  vibeScore: {
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  vibeNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  vibeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
