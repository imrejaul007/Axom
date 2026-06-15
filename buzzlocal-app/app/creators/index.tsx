/**
 * Creators Screen - Discover local creators
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Creator {
  id: string;
  name: string;
  avatar: string;
  role: string;
  area: string;
  followers: number;
  posts: number;
  tier: 'rising' | 'local' | 'expert' | 'authority';
  verified: boolean;
  badges: string[];
}

const ROLES = [
  { id: 'all', label: 'All', icon: 'people' },
  { id: 'food_scout', label: 'Food Scout', icon: 'restaurant' },
  { id: 'safety_guardian', label: 'Safety', icon: 'shield-checkmark' },
  { id: 'event_ambassador', label: 'Events', icon: 'calendar' },
  { id: 'deal_hunter', label: 'Deals', icon: 'pricetag' },
  { id: 'area_ambassador', label: 'Ambassador', icon: 'star' },
];

const TOP_CREATORS: Creator[] = [
  { id: '1', name: 'Priya Sharma', avatar: '', role: 'food_scout', area: 'Koramangala', followers: 2450, posts: 156, tier: 'authority', verified: true, badges: ['Top Food Scout', 'Local Legend'] },
  { id: '2', name: 'Rahul Verma', avatar: '', role: 'safety_guardian', area: 'Indiranagar', followers: 1890, posts: 89, tier: 'expert', verified: true, badges: ['Safety Guardian'] },
  { id: '3', name: 'Anita Das', avatar: '', role: 'event_ambassador', area: 'Whitefield', followers: 1234, posts: 67, tier: 'expert', verified: true, badges: ['Event Expert'] },
  { id: '4', name: 'Vikram Singh', avatar: '', role: 'deal_hunter', area: 'HSR Layout', followers: 980, posts: 234, tier: 'local', verified: true, badges: ['Deal Hunter'] },
];

const AREA_CREATORS: Creator[] = [
  { id: '5', name: 'Meera Patel', avatar: '', role: 'food_scout', area: 'Koramangala', followers: 567, posts: 45, tier: 'local', verified: true, badges: ['Food Scout'] },
  { id: '6', name: 'Arjun Nair', avatar: '', role: 'safety_guardian', area: 'Koramangala', followers: 423, posts: 32, tier: 'rising', verified: false, badges: [] },
  { id: '7', name: 'Kavitha Rajan', avatar: '', role: 'area_ambassador', area: 'Koramangala', followers: 789, posts: 98, tier: 'expert', verified: true, badges: ['Area Ambassador'] },
  { id: '8', name: 'Suresh Kumar', avatar: '', role: 'deal_hunter', area: 'Koramangala', followers: 345, posts: 67, tier: 'rising', verified: true, badges: [] },
];

export default function CreatorsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'food_scout':
        return 'restaurant';
      case 'safety_guardian':
        return 'shield-checkmark';
      case 'event_ambassador':
        return 'calendar';
      case 'deal_hunter':
        return 'pricetag';
      case 'area_ambassador':
        return 'star';
      default:
        return 'person';
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find((r) => r.id === role)?.label || role;
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'authority':
        return { color: '#FFD700', label: '👑 Authority' };
      case 'expert':
        return { color: '#C0C0C0', label: '🏆 Expert' };
      case 'local':
        return { color: '#CD7F32', label: '⭐ Local' };
      default:
        return { color: '#90EE90', label: '🌱 Rising' };
    }
  };

  const renderCreatorCard = (creator: Creator) => (
    <TouchableOpacity
      key={creator.id}
      style={styles.creatorCard}
      onPress={() => router.push(`/creators/${creator.id}`)}
    >
      <View style={styles.creatorAvatar}>
        <Text style={styles.creatorInitial}>{creator.name[0]}</Text>
        {creator.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.creatorInfo}>
        <View style={styles.creatorNameRow}>
          <Text style={styles.creatorName}>{creator.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name={getRoleIcon(creator.role) as any} size={10} color={COLORS.primary} />
            <Text style={styles.roleLabel}>{getRoleLabel(creator.role)}</Text>
          </View>
        </View>
        <Text style={styles.creatorArea}>{creator.area}</Text>
        <View style={styles.creatorStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{creator.followers}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{creator.posts}</Text>
            <Text style={styles.statLabel}>posts</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: getTierBadge(creator.tier).color }]}>
              {getTierBadge(creator.tier).label}
            </Text>
          </View>
        </View>
        {creator.badges.length > 0 && (
          <View style={styles.badges}>
            {creator.badges.slice(0, 2).map((badge, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Local Creators</Text>
        <TouchableOpacity onPress={() => router.push('/creators/program')}>
          <Ionicons name="ribbon-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search creators..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Role Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.roleFilter}
        contentContainerStyle={styles.roleFilterContent}
      >
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleChip,
              selectedRole === role.id && styles.roleChipActive,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <Ionicons
              name={role.icon as any}
              size={16}
              color={selectedRole === role.id ? '#fff' : COLORS.text}
            />
            <Text
              style={[
                styles.roleChipText,
                selectedRole === role.id && styles.roleChipTextActive,
              ]}
            >
              {role.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Creators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Creators</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topCreatorsContent}
          >
            {TOP_CREATORS.map((creator) => (
              <TouchableOpacity
                key={creator.id}
                style={styles.topCreatorCard}
                onPress={() => router.push(`/creators/${creator.id}`)}
              >
                <View style={styles.topCreatorAvatar}>
                  <Text style={styles.topCreatorInitial}>{creator.name[0]}</Text>
                </View>
                <Text style={styles.topCreatorName}>{creator.name}</Text>
                <Text style={styles.topCreatorRole}>{getRoleLabel(creator.role)}</Text>
                <View style={styles.topCreatorFollowers}>
                  <Text style={styles.topCreatorFollowersText}>
                    {creator.followers.toLocaleString()} followers
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Area Creators */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In Your Area</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {AREA_CREATORS.map((creator) => renderCreatorCard(creator))}
        </View>

        {/* Programs Banner */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.programBanner}>
            <View style={styles.programBannerContent}>
              <Text style={styles.programBannerTitle}>Become a Creator</Text>
              <Text style={styles.programBannerSubtitle}>
                Earn coins, get badges, and become a local expert
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
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
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  roleFilter: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  roleFilterContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  roleChipTextActive: {
    color: '#fff',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  topCreatorsContent: {
    gap: SPACING.md,
  },
  topCreatorCard: {
    width: 120,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  topCreatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  topCreatorInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  topCreatorName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  topCreatorRole: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  topCreatorFollowers: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  topCreatorFollowersText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  creatorCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  creatorInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  creatorName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  roleLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  creatorArea: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  creatorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  tierBadge: {
    marginLeft: 'auto',
  },
  tierText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: 6,
  },
  badge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '500',
  },
  programBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  programBannerContent: {
    flex: 1,
  },
  programBannerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  programBannerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
