/**
 * Crisis Resources - Emergency resources and supplies (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const RESOURCE_CATEGORIES = [
  { id: 'medical', label: 'Medical', icon: 'medkit', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] as [string, string] },
  { id: 'food', label: 'Food & Water', icon: 'nutrition', color: '#F97316', gradient: ['#F97316', '#EA580C'] as [string, string] },
  { id: 'shelter', label: 'Shelter', icon: 'bed', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] as [string, string] },
  { id: 'transport', label: 'Transport', icon: 'car', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as [string, string] },
  { id: 'rescue', label: 'Rescue', icon: 'life-buoy', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
  { id: 'communication', label: 'Communication', icon: 'radio', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] as [string, string] },
];

const MOCK_RESOURCES = {
  medical: [
    { id: '1', name: 'First Aid Kits', available: 150, location: 'Distribution Center A' },
    { id: '2', name: 'Medications', available: 500, location: 'Pharmacy Hub' },
    { id: '3', name: 'Bandages & Dressings', available: 1000, location: 'Warehouse B' },
    { id: '4', name: 'Oxygen Cylinders', available: 25, location: 'Hospital Storage' },
  ],
  food: [
    { id: '5', name: 'Water Bottles', available: 5000, location: 'Water Plant' },
    { id: '6', name: 'Ready-to-Eat Meals', available: 2000, location: 'Kitchen Center' },
    { id: '7', name: 'Baby Food', available: 300, location: 'Relief Camp A' },
    { id: '8', name: 'Dry Rations', available: 1000, location: 'Food Bank' },
  ],
  shelter: [
    { id: '9', name: 'Tents', available: 200, location: 'Sports Complex' },
    { id: '10', name: 'Blankets', available: 1000, location: 'Warehouse A' },
    { id: '11', name: 'Sleeping Bags', available: 300, location: 'School Shelter' },
    { id: '12', name: 'Mattresses', available: 500, location: 'Community Hall' },
  ],
  transport: [
    { id: '13', name: 'Buses', available: 20, location: 'Bus Depot' },
    { id: '14', name: 'Trucks', available: 15, location: 'Logistics Hub' },
    { id: '15', name: 'Boats', available: 10, location: 'Rescue Base' },
  ],
  rescue: [
    { id: '16', name: 'Life Jackets', available: 100, location: 'Rescue Base' },
    { id: '17', name: 'Ropes', available: 50, location: 'Fire Station' },
    { id: '18', name: 'Torches', available: 200, location: 'Police Station' },
  ],
  communication: [
    { id: '19', name: 'Power Banks', available: 100, location: 'Tech Center' },
    { id: '20', name: 'Walkie Talkies', available: 50, location: 'Command Center' },
  ],
};

export default function CrisisResourcesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('medical');
  const [searchQuery, setSearchQuery] = useState('');
  const [claimedResources, setClaimedResources] = useState<Record<string, number>>({});

  const currentResources = MOCK_RESOURCES[selectedCategory as keyof typeof MOCK_RESOURCES] || [];
  const filteredResources = currentResources.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryInfo = RESOURCE_CATEGORIES.find((c) => c.id === selectedCategory);
  const totalResources = Object.values(MOCK_RESOURCES).flat().length;

  const handleClaim = (resource) => {
    Alert.alert(
      'Claim Resource',
      `Claim ${resource.name} from ${resource.location}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: () => {
            setClaimedResources((prev) => ({
              ...prev,
              [resource.id]: (prev[resource.id] || 0) + 1,
            }));
            Alert.alert('Success', 'Resource claimed successfully');
          },
        },
      ]
    );
  };

  const handleGetDirections = (location: string) => {
    Alert.alert('Directions', `Would open maps to: ${location}`);
  };

  const handleCallContact = () => {
    Alert.alert('Contact', 'Would call emergency helpline');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crisis Resources</Text>
        <TouchableOpacity style={styles.emergencyButton} onPress={handleCallContact}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.emergencyGradient}>
            <Ionicons name="call" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Summary Banner */}
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.15)', 'transparent']}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name="cube" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryNumber}>{totalResources}</Text>
            <Text style={styles.summaryLabel}>Total Resources</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="location" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.summaryNumber}>24</Text>
            <Text style={styles.summaryLabel}>Distribution Points</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="pulse" size={24} color={COLORS.success} />
            </View>
            <Text style={[styles.summaryNumber, { color: COLORS.success }]}>Active</Text>
            <Text style={styles.summaryLabel}>Crisis Mode</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
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
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RESOURCE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              {selectedCategory === category.id ? (
                <LinearGradient colors={category.gradient} style={styles.categoryGradient}>
                  <Ionicons name={category.icon as any} size={16} color="#fff" />
                  <Text style={styles.categoryChipTextSelected}>{category.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryChipInactive}>
                  <Ionicons name={category.icon as any} size={16} color={category.color} />
                  <Text style={[styles.categoryChipText, { color: category.color }]}>
                    {category.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <LinearGradient colors={(categoryInfo?.gradient || ['#6B7280', '#4B5563']) as [string, string]} style={styles.categoryIconLarge}>
          <Ionicons name={categoryInfo?.icon as any} size={24} color="#fff" />
        </LinearGradient>
        <View style={styles.categoryHeaderInfo}>
          <Text style={styles.categoryTitle}>{categoryInfo?.label}</Text>
          <Text style={styles.categoryCount}>{filteredResources.length} items available</Text>
        </View>
      </View>

      {/* Resources List */}
      <ScrollView style={styles.resourcesList} showsVerticalScrollIndicator={false}>
        {filteredResources.map((resource) => (
          <View key={resource.id} style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>{resource.name}</Text>
                <View style={styles.resourceLocation}>
                  <Ionicons name="location" size={12} color={COLORS.textMuted} />
                  <Text style={styles.locationText}>{resource.location}</Text>
                </View>
              </View>
              <View style={[styles.availabilityBadge, { backgroundColor: COLORS.success + '15' }]}>
                <Text style={styles.availabilityText}>{resource.available}</Text>
                <Text style={styles.availabilityLabel}>available</Text>
              </View>
            </View>
            <View style={styles.resourceActions}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => handleGetDirections(resource.location)}
              >
                <Ionicons name="navigate" size={18} color={COLORS.primary} />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => handleClaim(resource)}
              >
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.claimGradient}>
                  <Ionicons name="hand-left" size={16} color="#fff" />
                  <Text style={styles.claimButtonText}>Claim</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredResources.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No resources found</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { icon: 'hand-left', label: 'Volunteer', color: COLORS.primary, route: '/crisis/volunteer' },
          { icon: 'checkmark-circle', label: 'Check In', color: COLORS.success, route: '/crisis/checkin' },
          { icon: 'map', label: 'Crisis Map', color: COLORS.warning, route: '/crisis/map' },
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickAction}
            onPress={() => router.push(action.route)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  emergencyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  emergencyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryGradient: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  summaryNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  categoryChip: {
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  categoryChipSelected: {},
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  categoryChipInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  categoryIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeaderInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  resourcesList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  resourceCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  resourceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  availabilityBadge: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  availabilityText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  availabilityLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  directionsText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  claimButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  claimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  claimButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  bottomSpacer: {
    height: 100,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickAction: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
