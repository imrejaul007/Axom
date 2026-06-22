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
import { useAuthStore, useGamificationStore } from '@/store';

const MOCK_BADGES = [
  { id: '1', name: 'First Post', icon: '📝', rarity: 'common' as const, earned: true },
  { id: '2', name: 'Explorer', icon: '🗺️', rarity: 'common' as const, earned: true },
  { id: '3', name: 'Night Owl', icon: '🦉', rarity: 'rare' as const, earned: false },
  { id: '4', name: 'Foodie', icon: '🍔', rarity: 'common' as const, earned: true },
  { id: '5', name: 'Event Hunter', icon: '🎯', rarity: 'epic' as const, earned: false },
];

const MOCK_STREAKS = [
  { type: 'login', current: 7, best: 14, label: 'Login Streak', icon: '🔥' },
  { type: 'posting', current: 3, best: 10, label: 'Posting Streak', icon: '✍️' },
  { type: 'exploring', current: 0, best: 5, label: 'Exploring', icon: '🗺️' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, coinBalance } = useAuthStore();
  const { leaderboards } = useGamificationStore();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9333EA';
      case 'rare':
        return '#3B82F6';
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="qr-code-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar
            uri={user?.avatar || undefined}
            name={user?.displayName || 'User'}
            size="xlarge"
          />
          <Text style={styles.displayName}>{user?.displayName || 'Explorer'}</Text>
          <Text style={styles.username}>@{user?.username || 'user'}</Text>

          {user?.reputationLevel && (
            <Badge
              label={user.reputationLevel}
              rarity={user.reputationLevel === 'Verified Creator' ? 'legendary' : 'common'}
              style={styles.reputationBadge}
            />
          )}

          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => router.push('/wallet')}
        >
          <View style={styles.walletLeft}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={24} color={COLORS.coinGold} />
            </View>
            <View>
              <Text style={styles.walletTitle}>ReZ Coins</Text>
              <Text style={styles.walletSubtitle}>Tap to view transactions</Text>
            </View>
          </View>
          <View style={styles.walletRight}>
            <CoinDisplay amount={coinBalance || 0} size="large" />
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Streaks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Streaks</Text>
          </View>
          <View style={styles.streaksContainer}>
            {MOCK_STREAKS.map((streak) => (
              <View key={streak.type} style={styles.streakCard}>
                <Text style={styles.streakIcon}>{streak.icon}</Text>
                <Text style={styles.streakCurrent}>{streak.current}</Text>
                <Text style={styles.streakLabel}>{streak.label}</Text>
                <View style={styles.streakProgress}>
                  <View
                    style={[
                      styles.streakProgressFill,
                      { width: `${Math.min((streak.current / streak.best) * 100, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesContainer}
          >
            {MOCK_BADGES.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeCardLocked,
                ]}
              >
                <Text style={[styles.badgeIcon, !badge.earned && styles.badgeIconLocked]}>
                  {badge.icon}
                </Text>
                <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <View
                  style={[
                    styles.badgeRarity,
                    { backgroundColor: getRarityColor(badge.rarity) + '20' },
                  ]}
                >
                  <Text style={[styles.badgeRarityText, { color: getRarityColor(badge.rarity) }]}>
                    {badge.rarity}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="bookmark" size={22} color={COLORS.text} />
              <Text style={styles.menuText}>Saved Posts</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="people" size={22} color={COLORS.text} />
              <Text style={styles.menuText}>Communities</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="star" size={22} color={COLORS.text} />
              <Text style={styles.menuText}>Leaderboard</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/creator')}>
              <Ionicons name="diamond" size={22} color={COLORS.text} />
              <Text style={styles.menuText}>Creator Dashboard</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  displayName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  username: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  reputationBadge: {
    marginTop: SPACING.sm,
  },
  bio: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coinGold + '40',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.coinGold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  walletTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  walletSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 24,
  },
  streakCurrent: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  streakLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  streakProgress: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    backgroundColor: COLORS.streakFire,
    borderRadius: 2,
  },
  badgesContainer: {
    paddingRight: SPACING.md,
  },
  badgeCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
    width: 100,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  badgeIconLocked: {
    // Grayscale filter effect via opacity
  },
  badgeName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: COLORS.textMuted,
  },
  badgeRarity: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
  badgeRarityText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  menuList: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  bottomPadding: {
    height: 100,
  },
});
