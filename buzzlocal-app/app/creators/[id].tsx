/**
 * Creator Profile Screen - Detailed view of a local creator
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface ContentPost {
  id: string;
  type: 'deal' | 'safety' | 'event' | 'area' | 'review';
  title: string;
  description: string;
  engagement: number;
  timestamp: string;
  coinsEarned: number;
}

interface CreatorProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  roleLabel: string;
  area: string;
  followers: number;
  following: number;
  posts: number;
  tier: 'rising' | 'local' | 'expert' | 'authority';
  verified: boolean;
  badges: string[];
  bio: string;
  joinedDate: string;
  totalCoins: number;
  contributionScore: number;
  content: ContentPost[];
  stats: {
    dealsPosted: number;
    safetyAlerts: number;
    eventsCreated: number;
    areaGuides: number;
  };
}

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'stats' | 'about'>('posts');

  useEffect(() => {
    fetchCreatorProfile();
  }, [id]);

  const fetchCreatorProfile = async () => {
    try {
      // Mock data - replace with actual API call
      setCreator({
        id: id || '1',
        name: 'Priya Sharma',
        avatar: '',
        role: 'food_scout',
        roleLabel: 'Food Scout',
        area: 'Koramangala',
        followers: 2450,
        following: 234,
        posts: 156,
        tier: 'authority',
        verified: true,
        badges: ['Top Food Scout', 'Local Legend', 'Deal Master', 'Safety Champion'],
        bio: 'Your friendly neighborhood food explorer! I discover the best deals, hidden gems, and food spots in Koramangala. Follow me for daily recommendations! 🍕',
        joinedDate: 'March 2025',
        totalCoins: 12500,
        contributionScore: 98,
        content: [
          { id: '1', type: 'deal', title: '50% Off at Spicy Kitchen', description: 'Valid until weekend - great place for biryani!', engagement: 456, timestamp: '2 hours ago', coinsEarned: 120 },
          { id: '2', type: 'safety', title: 'Road Work Alert', description: 'Koramangala 5th Block - expect delays', engagement: 234, timestamp: '5 hours ago', coinsEarned: 80 },
          { id: '3', type: 'event', title: 'Food Festival This Weekend', description: 'Forum Mall hosting street food fest', engagement: 678, timestamp: '1 day ago', coinsEarned: 200 },
          { id: '4', type: 'area', title: 'Hidden Gems of HSR', description: 'My complete guide to HSR Layout cafes', engagement: 890, timestamp: '2 days ago', coinsEarned: 250 },
          { id: '5', type: 'review', title: 'Review: The Burger Company', description: 'Best burgers in BTM Layout - must try!', engagement: 345, timestamp: '3 days ago', coinsEarned: 90 },
        ],
        stats: {
          dealsPosted: 89,
          safetyAlerts: 45,
          eventsCreated: 23,
          areaGuides: 12,
        },
      });
    } catch (error) {
      console.error('Failed to fetch creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'food_scout': return 'restaurant';
      case 'safety_guardian': return 'shield-checkmark';
      case 'event_ambassador': return 'calendar';
      case 'deal_hunter': return 'pricetag';
      case 'area_ambassador': return 'star';
      default: return 'person';
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'authority': return { color: '#FFD700', label: 'Authority', emoji: '👑' };
      case 'expert': return { color: '#C0C0C0', label: 'Expert', emoji: '🏆' };
      case 'local': return { color: '#CD7F32', label: 'Local', emoji: '⭐' };
      default: return { color: '#90EE90', label: 'Rising', emoji: '🌱' };
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'deal': return 'pricetag';
      case 'safety': return 'shield-checkmark';
      case 'event': return 'calendar';
      case 'area': return 'map';
      case 'review': return 'star';
      default: return 'document-text';
    }
  };

  const getContentColor = (type: string) => {
    switch (type) {
      case 'deal': return COLORS.success;
      case 'safety': return COLORS.error;
      case 'event': return COLORS.primary;
      case 'area': return COLORS.warning;
      case 'review': return '#9333EA';
      default: return COLORS.textSecondary;
    }
  };

  if (!creator) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tierInfo = getTierInfo(creator.tier);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{creator.name[0]}</Text>
            </View>
            {creator.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.name}>{creator.name}</Text>

          <View style={styles.roleRow}>
            <View style={[styles.roleBadge, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name={getRoleIcon(creator.role) as any} size={14} color={COLORS.primary} />
              <Text style={styles.roleText}>{creator.roleLabel}</Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '20' }]}>
              <Text style={styles.tierEmoji}>{tierInfo.emoji}</Text>
              <Text style={[styles.tierText, { color: tierInfo.color }]}>{tierInfo.label}</Text>
            </View>
          </View>

          <Text style={styles.areaText}>
            <Ionicons name="location" size={14} color={COLORS.textSecondary} />
            {' '}{creator.area}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creator.followers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creator.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creator.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.followButton}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrButton}>
              <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.badgesContainer}>
              {creator.badges.map((badge, i) => (
                <View key={i} style={styles.badgeItem}>
                  <Ionicons name="ribbon" size={20} color={COLORS.warning} />
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Highlights */}
        <View style={styles.section}>
          <View style={styles.highlightsRow}>
            <View style={[styles.highlightCard, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="cash-outline" size={24} color={COLORS.warning} />
              <Text style={styles.highlightValue}>{creator.totalCoins.toLocaleString()}</Text>
              <Text style={styles.highlightLabel}>Coins Earned</Text>
            </View>
            <View style={[styles.highlightCard, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="trophy-outline" size={24} color={COLORS.success} />
              <Text style={styles.highlightValue}>{creator.contributionScore}</Text>
              <Text style={styles.highlightLabel}>Score</Text>
            </View>
            <View style={[styles.highlightCard, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={styles.highlightValue}>{creator.joinedDate.split(' ')[0]}</Text>
              <Text style={styles.highlightLabel}>Joined</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.section}>
            {creator.content.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={[styles.postIcon, { backgroundColor: getContentColor(post.type) + '20' }]}>
                    <Ionicons name={getContentIcon(post.type) as any} size={16} color={getContentColor(post.type)} />
                  </View>
                  <View style={styles.postMeta}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postTime}>{post.timestamp}</Text>
                  </View>
                  <View style={styles.postCoins}>
                    <Ionicons name="logo-bitcoin" size={14} color={COLORS.warning} />
                    <Text style={styles.coinValue}>+{post.coinsEarned}</Text>
                  </View>
                </View>
                <Text style={styles.postDescription}>{post.description}</Text>
                <View style={styles.postFooter}>
                  <View style={styles.engagementBadge}>
                    <Ionicons name="heart" size={14} color={COLORS.error} />
                    <Text style={styles.engagementText}>{post.engagement}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Ionicons name="pricetag" size={32} color={COLORS.success} />
                <Text style={styles.statsCardValue}>{creator.stats.dealsPosted}</Text>
                <Text style={styles.statsCardLabel}>Deals Posted</Text>
              </View>
              <View style={styles.statsCard}>
                <Ionicons name="shield-checkmark" size={32} color={COLORS.error} />
                <Text style={styles.statsCardValue}>{creator.stats.safetyAlerts}</Text>
                <Text style={styles.statsCardLabel}>Safety Alerts</Text>
              </View>
              <View style={styles.statsCard}>
                <Ionicons name="calendar" size={32} color={COLORS.primary} />
                <Text style={styles.statsCardValue}>{creator.stats.eventsCreated}</Text>
                <Text style={styles.statsCardLabel}>Events Created</Text>
              </View>
              <View style={styles.statsCard}>
                <Ionicons name="map" size={32} color={COLORS.warning} />
                <Text style={styles.statsCardValue}>{creator.stats.areaGuides}</Text>
                <Text style={styles.statsCardLabel}>Area Guides</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.section}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutLabel}>Bio</Text>
              <Text style={styles.aboutText}>{creator.bio}</Text>
            </View>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutLabel}>Member Since</Text>
              <Text style={styles.aboutValue}>{creator.joinedDate}</Text>
            </View>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutLabel}>Primary Area</Text>
              <Text style={styles.aboutValue}>{creator.area}</Text>
            </View>
            <TouchableOpacity style={styles.reportButton}>
              <Ionicons name="flag-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.reportText}>Report Creator</Text>
            </TouchableOpacity>
          </View>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  roleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  tierEmoji: {
    fontSize: 14,
  },
  tierText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  areaText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  followButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  highlightCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  highlightValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  highlightLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  postIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  postMeta: {
    flex: 1,
  },
  postTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  postCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  postDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  engagementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statsCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statsCardValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statsCardLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aboutCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  aboutLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aboutText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  aboutValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  reportText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});
