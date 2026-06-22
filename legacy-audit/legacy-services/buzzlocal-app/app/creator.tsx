import React from 'react';
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
import { Avatar, Badge, CoinDisplay, Button } from '@/components/ui';
import { useAuthStore } from '@/store';

const STATS = [
  { label: 'Total Views', value: '12.5K', change: '+15%', icon: 'eye' },
  { label: 'Engagement', value: '8.2%', change: '+3%', icon: 'heart' },
  { label: 'Followers', value: '1.2K', change: '+45', icon: 'people' },
  { label: 'This Week', value: '+850', change: '', icon: 'trending-up' },
];

const TOP_POSTS = [
  { id: '1', title: 'Best brunch spots in Koramangala', views: '2.5K', engagement: '12%' },
  { id: '2', title: 'Hidden cafes in Indiranagar', views: '1.8K', engagement: '15%' },
  { id: '3', title: 'Weekend food guide', views: '1.2K', engagement: '9%' },
];

const EARNINGS = [
  { label: 'This Month', amount: 2500 },
  { label: 'Total Earned', amount: 12500 },
  { label: 'Pending', amount: 500 },
];

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              uri={user?.avatar || undefined}
              name={user?.displayName || 'Creator'}
              size="large"
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{user?.displayName || 'Creator'}</Text>
                <Badge label="Creator" rarity="rare" size="small" />
              </View>
              <Text style={styles.username}>@{user?.username || 'creator'}</Text>
              <View style={styles.creatorBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                <Text style={styles.creatorBadgeText}>Verified Creator</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons
                  name={stat.icon as any}
                  size={18}
                  color={COLORS.primary}
                />
                {stat.change && (
                  <Text style={styles.statChange}>{stat.change}</Text>
                )}
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>Earnings</Text>
            <TouchableOpacity>
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.earningsAmount}>
            <CoinDisplay amount={2500} size="large" />
            <Text style={styles.earningsLabel}>This Month</Text>
          </View>
          <View style={styles.earningsBreakdown}>
            {EARNINGS.map((item, index) => (
              <View key={index} style={styles.earningsItem}>
                <Text style={styles.earningsItemLabel}>{item.label}</Text>
                <Text style={styles.earningsItemAmount}>{item.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Performing Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performing Posts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {TOP_POSTS.map((post, index) => (
            <TouchableOpacity key={post.id} style={styles.postItem}>
              <View style={styles.postRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.postInfo}>
                <Text style={styles.postTitle} numberOfLines={1}>
                  {post.title}
                </Text>
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Ionicons name="eye-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.postStatText}>{post.views}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.postStatText}>{post.engagement}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Monetization Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monetization</Text>
          <View style={styles.monetizationGrid}>
            <TouchableOpacity style={styles.monetizationCard}>
              <View style={[styles.monetizationIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="link" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.monetizationLabel}>Affiliate Links</Text>
              <Text style={styles.monetizationDescription}>
                Earn from merchant partnerships
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.monetizationCard}>
              <View style={[styles.monetizationIcon, { backgroundColor: COLORS.accent + '20' }]}>
                <Ionicons name="storefront" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.monetizationLabel}>Sponsored Posts</Text>
              <Text style={styles.monetizationDescription}>
                Get paid for reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.monetizationCard}>
              <View style={[styles.monetizationIcon, { backgroundColor: COLORS.coinGold + '20' }]}>
                <Ionicons name="cash" size={24} color={COLORS.coinGold} />
              </View>
              <Text style={styles.monetizationLabel}>Tips</Text>
              <Text style={styles.monetizationDescription}>
                Accept tips from followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.monetizationCard}>
              <View style={[styles.monetizationIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="ticket" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.monetizationLabel}>Event Tickets</Text>
              <Text style={styles.monetizationDescription}>
                Sell event tickets
              </Text>
            </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  username: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  creatorBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    marginRight: '4%',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  statChange: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  earningsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coinGold + '40',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  earningsTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  withdrawText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  earningsAmount: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earningsLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsItemLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  earningsItemAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
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
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  postRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rankNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  postStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  postStatText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  monetizationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monetizationCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  monetizationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  monetizationLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  monetizationDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
});
