import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function MarketplaceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'browse' | 'sell'>('browse');
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'furniture', label: 'Furniture', icon: 'bed' },
    { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
    { id: 'housing', label: 'PG/Rooms', icon: 'home' },
    { id: 'vehicles', label: 'Vehicles', icon: 'car' },
    { id: 'books', label: 'Books', icon: 'book' },
    { id: 'fashion', label: 'Fashion', icon: 'shirt' },
    { id: 'services', label: 'Services', icon: 'construct' },
  ];

  const listings = [
    {
      id: '1',
      title: 'Sony Bravia 55" Smart TV',
      price: 45000,
      condition: 'like_new',
      location: 'Koramangala',
      seller: 'Rahul M.',
      trustBadge: 'trusted',
      image: null,
      time: '2 hours ago'
    },
    {
      id: '2',
      title: 'Single Room in 3BHK - Girls PG',
      price: 8000,
      condition: null,
      location: 'Indiranagar',
      seller: 'Priya S.',
      trustBadge: 'verified',
      image: null,
      time: '4 hours ago'
    },
    {
      id: '3',
      title: 'IKEA Sofa - 3 Seater',
      price: 15000,
      condition: 'good',
      location: 'HSR Layout',
      seller: 'Amit K.',
      trustBadge: 'new',
      image: null,
      time: '1 day ago'
    },
    {
      id: '4',
      title: 'Honda Activa - 2022',
      price: 65000,
      condition: null,
      location: 'BTM Layout',
      seller: 'Vikram R.',
      trustBadge: 'trusted',
      image: null,
      time: '2 days ago'
    },
  ];

  const getTrustBadge = (badge: string) => {
    const badges: Record<string, { icon: string; color: string }> = {
      trusted: { icon: 'star', color: colors.accentGold },
      verified: { icon: 'checkmark-circle', color: colors.accentGreen },
      new: { icon: 'person', color: colors.textMuted }
    };
    return badges[badge] || badges.new;
  };

  const getConditionLabel = (condition: string | null) => {
    if (!condition) return null;
    const labels: Record<string, { label: string; color: string }> = {
      new: { label: 'New', color: colors.accentGreen },
      like_new: { label: 'Like New', color: colors.primary },
      good: { label: 'Good', color: colors.textSecondary },
      fair: { label: 'Fair', color: colors.accent }
    };
    return labels[condition];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/marketplace/create' as any)}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
          <Text style={styles.createText}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={category === cat.id ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listingsContainer}
        columnWrapperStyle={styles.listingRow}
        renderItem={({ item }) => {
          const condition = getConditionLabel(item.condition);
          const trust = getTrustBadge(item.trustBadge);

          return (
            <TouchableOpacity
              style={styles.listingCard}
              onPress={() => router.push(`/marketplace/${item.id}` as any)}
            >
              <View style={styles.listingImagePlaceholder}>
                <Ionicons name="image" size={32} color={colors.textMuted} />
              </View>
              <View style={styles.listingContent}>
                <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.listingPrice}>₹{item.price.toLocaleString()}</Text>
                <View style={styles.listingMeta}>
                  <View style={styles.listingLocation}>
                    <Ionicons name="location" size={12} color={colors.textMuted} />
                    <Text style={styles.listingLocationText}>{item.location}</Text>
                  </View>
                  {condition && (
                    <View style={[styles.conditionBadge, { backgroundColor: condition.color + '20' }]}>
                      <Text style={[styles.conditionText, { color: condition.color }]}>{condition.label}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.listingFooter}>
                  <View style={styles.sellerInfo}>
                    <Ionicons name={trust.icon as any} size={12} color={trust.color} />
                    <Text style={styles.sellerName}>{item.seller}</Text>
                  </View>
                  <Text style={styles.listingTime}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  createText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listingsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listingRow: {
    justifyContent: 'space-between',
  },
  listingCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listingImagePlaceholder: {
    height: 120,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingContent: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingLocationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  listingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listingTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
