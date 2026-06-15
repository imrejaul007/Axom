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

export default function ServicesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Services', icon: 'apps' },
    { id: 'plumber', label: 'Plumber', icon: 'water' },
    { id: 'electrician', label: 'Electrician', icon: 'flash' },
    { id: 'cleaning', label: 'Cleaning', icon: 'sparkles' },
    { id: 'beauty', label: 'Beauty', icon: 'cut' },
    { id: 'fitness', label: 'Fitness', icon: 'fitness' },
    { id: 'tutor', label: 'Tutor', icon: 'school' },
    { id: 'repair', label: 'Repair', icon: 'construct' },
  ];

  const services = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      profession: 'Electrician',
      rating: 4.8,
      reviews: 156,
      distance: '0.8 km',
      price: '₹200-500',
      verified: true,
      available: true,
      image: null,
    },
    {
      id: '2',
      name: 'Priya Sharma',
      profession: 'Home Cleaning',
      rating: 4.9,
      reviews: 89,
      distance: '1.2 km',
      price: '₹500-1500',
      verified: true,
      available: true,
      image: null,
    },
    {
      id: '3',
      name: 'Amit Patel',
      profession: 'Plumber',
      rating: 4.6,
      reviews: 203,
      distance: '0.5 km',
      price: '₹250-600',
      verified: true,
      available: false,
      image: null,
    },
    {
      id: '4',
      name: 'Neha Singh',
      profession: 'Beauty & Makeup',
      rating: 4.9,
      reviews: 67,
      distance: '1.5 km',
      price: '₹500-2000',
      verified: false,
      available: true,
      image: null,
    },
    {
      id: '5',
      name: 'Vikram Rao',
      profession: 'AC Repair',
      rating: 4.7,
      reviews: 134,
      distance: '2.0 km',
      price: '₹300-800',
      verified: true,
      available: true,
      image: null,
    },
    {
      id: '6',
      name: 'Sunita Devi',
      profession: 'Cooking Classes',
      rating: 4.8,
      reviews: 45,
      distance: '0.9 km',
      price: '₹300-1000',
      verified: false,
      available: true,
      image: null,
    },
  ];

  const getCategoryIcon = (icon: string) => {
    const icons: Record<string, string> = {
      apps: 'apps',
      water: 'water',
      flash: 'flash',
      sparkles: 'sparkles',
      cut: 'cut',
      fitness: 'fitness',
      school: 'school',
      construct: 'construct',
    };
    return icons[icon] || 'help-circle';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Local Services</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for services..."
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
            style={[styles.categoryCard, selectedCategory === cat.id && styles.categoryCardActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <View style={[styles.categoryIcon, selectedCategory === cat.id && styles.categoryIconActive]}>
              <Ionicons
                name={getCategoryIcon(cat.icon) as any}
                size={24}
                color={selectedCategory === cat.id ? colors.primary : colors.textMuted}
              />
            </View>
            <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Nearby</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Top Rated</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Available Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Ionicons name="swap-vertical" size={14} color={colors.textMuted} />
          <Text style={styles.filterText}>Price</Text>
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.servicesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.serviceCard}>
            <View style={styles.serviceImage}>
              <Ionicons name="person" size={40} color={colors.textMuted} />
            </View>
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  {item.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.accentGreen} />
                    </View>
                  )}
                </View>
                <Text style={styles.serviceProfession}>{item.profession}</Text>
              </View>

              <View style={styles.serviceMeta}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.accentGold} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                  <Text style={styles.reviewsText}>({item.reviews})</Text>
                </View>
                <View style={styles.distanceRow}>
                  <Ionicons name="location" size={14} color={colors.textMuted} />
                  <Text style={styles.distanceText}>{item.distance}</Text>
                </View>
              </View>

              <View style={styles.serviceFooter}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{item.price}</Text>
                </View>
                <View style={styles.availabilityRow}>
                  <View style={[styles.availabilityDot, { backgroundColor: item.available ? colors.accentGreen : colors.accent }]} />
                  <Text style={styles.availabilityText}>
                    {item.available ? 'Available' : 'Busy'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.serviceActions}>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color={colors.accentGreen} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.ctaButton}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={styles.ctaText}>Register as Service Provider</Text>
        </TouchableOpacity>
      </View>
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
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: 90,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    width: 80,
  },
  categoryCardActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconActive: {
    backgroundColor: colors.primary + '30',
  },
  categoryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  servicesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  serviceImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceContent: {
    flex: 1,
  },
  serviceHeader: {
    marginBottom: 6,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  serviceProfession: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentGold,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  serviceActions: {
    justifyContent: 'center',
    gap: 8,
  },
  callButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.accentGreen + '20',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
