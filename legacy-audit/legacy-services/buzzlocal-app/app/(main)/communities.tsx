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
import { CommunityType } from '@/types';

const COMMUNITY_TYPES = [
  { id: 'area', label: 'Area', icon: 'location', color: COLORS.primary },
  { id: 'interest', label: 'Interest', icon: 'heart', color: COLORS.accent },
  { id: 'apartment', label: 'Apartment', icon: 'home', color: COLORS.success },
  { id: 'campus', label: 'Campus', icon: 'school', color: COLORS.info },
];

const MOCK_COMMUNITIES = [
  { id: '1', name: 'Koramangala Locals', type: 'area' as CommunityType, members: 1234, description: 'Everything about Koramangala', isJoined: true },
  { id: '2', name: 'Foodies of Bangalore', type: 'interest' as CommunityType, members: 5678, description: 'Share food spots and recommendations', isJoined: true },
  { id: '3', name: 'Tech Bangalore', type: 'interest' as CommunityType, members: 4321, description: 'Tech events, meetups, and discussions', isJoined: false },
  { id: '4', name: 'Prestige Falcon City', type: 'apartment' as CommunityType, members: 456, description: 'Community for Falcon City residents', isJoined: false },
  { id: '5', name: 'IIT Bangalore', type: 'campus' as CommunityType, members: 2345, description: 'IIT Bangalore alumni and students', isJoined: false },
  { id: '6', name: 'Indiranagar Nightlife', type: 'area' as CommunityType, members: 890, description: 'Best nightlife spots in Indiranagar', isJoined: false },
];

const YOUR_COMMUNITIES = MOCK_COMMUNITIES.filter(c => c.isJoined);

export default function CommunitiesScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CommunityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunities = MOCK_COMMUNITIES.filter(community => {
    const matchesType = selectedType === 'all' || community.type === selectedType;
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeColor = (type: CommunityType) => {
    const found = COMMUNITY_TYPES.find(t => t.id === type);
    return found?.color || COLORS.primary;
  };

  const getTypeIcon = (type: CommunityType) => {
    const found = COMMUNITY_TYPES.find(t => t.id === type);
    return found?.icon || 'people';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-community')}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Search communities...</Text>
      </View>

      {/* Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedType === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[
            styles.filterText,
            selectedType === 'all' && styles.filterTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {COMMUNITY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterChip,
              selectedType === type.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(type.id as CommunityType)}
          >
            <Ionicons
              name={type.icon as any}
              size={16}
              color={selectedType === type.id ? COLORS.text : COLORS.textMuted}
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText,
              selectedType === type.id && styles.filterTextActive,
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Your Communities */}
        {YOUR_COMMUNITIES.length > 0 && selectedType === 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Communities</Text>
            {YOUR_COMMUNITIES.map((community) => (
              <TouchableOpacity
                key={community.id}
                style={styles.communityCard}
                onPress={() => router.push(`/community/${community.id}`)}
              >
                <View style={[styles.communityIcon, { backgroundColor: getTypeColor(community.type) + '20' }]}>
                  <Ionicons
                    name={getTypeIcon(community.type) as any}
                    size={24}
                    color={getTypeColor(community.type)}
                  />
                </View>
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  <Text style={styles.communityMembers}>
                    {community.members.toLocaleString()} members
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Discover */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover</Text>
          {filteredCommunities
            .filter(c => selectedType !== 'all' || !c.isJoined)
            .map((community) => (
              <TouchableOpacity
                key={community.id}
                style={styles.communityCard}
                onPress={() => router.push(`/community/${community.id}`)}
              >
                <View style={[styles.communityIcon, { backgroundColor: getTypeColor(community.type) + '20' }]}>
                  <Ionicons
                    name={getTypeIcon(community.type) as any}
                    size={24}
                    color={getTypeColor(community.type)}
                  />
                </View>
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  <Text style={styles.communityDescription} numberOfLines={1}>
                    {community.description}
                  </Text>
                  <Text style={styles.communityMembers}>
                    {community.members.toLocaleString()} members
                  </Text>
                </View>
                {!community.isJoined && (
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      // Handle join
                    }}
                  >
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.text,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  communityDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  communityMembers: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  joinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
