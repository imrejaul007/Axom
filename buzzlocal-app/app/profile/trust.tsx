import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
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

const TRUST_LEVELS = [
  { level: 'new', badge: '🟢', label: 'New', min: 0, color: '#22C55E' },
  { level: 'verified', badge: '✅', label: 'Verified', min: 50, color: '#3B82F6' },
  { level: 'trusted', badge: '⭐', label: 'Trusted', min: 100, color: '#F59E0B' },
  { level: 'expert', badge: '🏆', label: 'Expert', min: 250, color: '#8B5CF6' },
  { level: 'guardian', badge: '🛡️', label: 'Guardian', min: 500, color: '#EF4444' },
  { level: 'legend', badge: '👑', label: 'Legend', min: 1000, color: '#FFD700' },
];

const BADGES = [
  { id: 'first_post', icon: '🎉', name: 'First Post', rarity: 'common' },
  { id: 'explorer', icon: '🗺️', name: 'Explorer', rarity: 'common' },
  { id: 'food_scout', icon: '🍔', name: 'Food Scout', rarity: 'common' },
  { id: 'night_owl', icon: '🦉', name: 'Night Owl', rarity: 'rare' },
  { id: 'event_hunter', icon: '🎯', name: 'Event Hunter', rarity: 'rare' },
  { id: 'safety_hero', icon: '🚨', name: 'Safety Hero', rarity: 'rare' },
  { id: 'helper', icon: '🤝', name: 'Helper', rarity: 'rare' },
  { id: 'local_legend', icon: '⭐', name: 'Local Legend', rarity: 'epic' },
  { id: 'truth_teller', icon: '✅', name: 'Truth Teller', rarity: 'rare' },
  { id: 'early_bird', icon: '🐦', name: 'Early Bird', rarity: 'epic' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Priya S.', score: 2450, badge: '👑', area: 'Koramangala' },
  { rank: 2, name: 'Rahul M.', score: 2100, badge: '🛡️', area: 'Indiranagar' },
  { rank: 3, name: 'Amit K.', score: 1850, badge: '🏆', area: 'HSR Layout' },
  { rank: 4, name: 'Sneha R.', score: 1600, badge: '⭐', area: 'Whitefield' },
  { rank: 5, name: 'Vikram J.', score: 1450, badge: '⭐', area: 'BTM Layout' },
];

export default function TrustProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(285);
  const [earnedBadges, setEarnedBadges] = useState<string[]>(['first_post', 'explorer', 'food_scout', 'helper']);
  const [stats, setStats] = useState({
    posts: 45,
    answers: 28,
    helpfulAnswers: 12,
    followers: 156,
    following: 89,
    alerts: 3,
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const currentLevel = TRUST_LEVELS.find((l, i, arr) => {
    const next = arr[i + 1];
    return score >= l.min && (!next || score < next.min);
  }) || TRUST_LEVELS[0];

  const nextLevel = TRUST_LEVELS[TRUST_LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        <View style={[styles.levelBadge, { backgroundColor: currentLevel.color + '20' }]}>
          <Text style={styles.levelBadgeText}>{currentLevel.badge}</Text>
        </View>
        <Text style={styles.scoreNumber}>{score}</Text>
        <Text style={[styles.levelLabel, { color: currentLevel.color }]}>
          {currentLevel.label}
        </Text>

        {nextLevel && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {nextLevel.min - score} points to {nextLevel.label}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.posts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.answers}</Text>
          <Text style={styles.statLabel}>Answers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.helpfulAnswers}</Text>
          <Text style={styles.statLabel}>Helpful</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      {/* Level Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Abilities</Text>
        <View style={styles.abilitiesList}>
          {currentLevel.level === 'new' && (
            ['Basic features', 'Can browse', 'Can ask questions'].map((a, i) => (
              <View key={i} style={styles.abilityItem}>
                <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                <Text style={styles.abilityText}>{a}</Text>
              </View>
            ))
          )}
          {currentLevel.level === 'verified' && (
            ['Can post', 'Can comment', 'Can answer', 'Earn coins'].map((a, i) => (
              <View key={i} style={[styles.abilityItem, styles.abilityUnlocked]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                <Text style={styles.abilityText}>{a}</Text>
              </View>
            ))
          )}
          {['verified', 'trusted', 'expert', 'guardian', 'legend'].includes(currentLevel.level) && (
            ['Can post', 'Can comment', 'Can answer', 'Earn coins', 'Can verify alerts', 'Priority in search'].map((a, i) => (
              <View key={i} style={[styles.abilityItem, styles.abilityUnlocked]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                <Text style={styles.abilityText}>{a}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Badges</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <View
                key={badge.id}
                style={[styles.badgeItem, !earned && styles.badgeLocked]}
              >
                <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
                  {badge.icon}
                </Text>
                <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <View style={[styles.rarityDot, { backgroundColor: badge.rarity === 'epic' ? colors.accentGold : badge.rarity === 'rare' ? colors.primary : colors.textMuted }]} />
              </View>
            );
          })}
        </View>
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Area Leaderboard</Text>
        {LEADERBOARD.map((user) => (
          <View key={user.rank} style={styles.leaderItem}>
            <View style={[styles.rankBadge, user.rank <= 3 && { backgroundColor: user.rank === 1 ? colors.accentGold : user.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>
              <Text style={styles.rankText}>{user.rank}</Text>
            </View>
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName}>{user.name}</Text>
              <Text style={styles.leaderArea}>{user.area}</Text>
            </View>
            <View style={styles.leaderScore}>
              <Text style={styles.leaderScoreText}>{user.score}</Text>
              <Text style={styles.leaderBadge}>{user.badge}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Verification Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Increase Your Score</Text>
        <TouchableOpacity style={styles.verifyCard}>
          <Ionicons name="location" size={24} color={colors.primary} />
          <View style={styles.verifyInfo}>
            <Text style={styles.verifyTitle}>Verify Address</Text>
            <Text style={styles.verifyDesc}>+25 points</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.verifyCard}>
          <Ionicons name="business" size={24} color={colors.primary} />
          <View style={styles.verifyInfo}>
            <Text style={styles.verifyTitle}>Verify Society</Text>
            <Text style={styles.verifyDesc}>+30 points</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.verifyCard}>
          <Ionicons name="card" size={24} color={colors.primary} />
          <View style={styles.verifyInfo}>
            <Text style={styles.verifyTitle}>Verify ID</Text>
            <Text style={styles.verifyDesc}>+20 points</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 16 },
  scoreCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, padding: 24, marginBottom: 20 },
  levelBadge: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  levelBadgeText: { fontSize: 32 },
  scoreNumber: { fontSize: 48, fontWeight: 'bold', color: colors.textPrimary },
  levelLabel: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  progressContainer: { width: '100%', marginTop: 20 },
  progressBar: { height: 8, backgroundColor: colors.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  statsGrid: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  abilitiesList: { backgroundColor: colors.surface, borderRadius: 12, padding: 8 },
  abilityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 12 },
  abilityUnlocked: {},
  abilityText: { fontSize: 14, color: colors.textSecondary },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { width: '30%', backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center' },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeIconLocked: {},
  badgeName: { fontSize: 11, color: colors.textPrimary, textAlign: 'center' },
  badgeNameLocked: { color: colors.textMuted },
  rarityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  leaderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaderArea: { fontSize: 12, color: colors.textMuted },
  leaderScore: { alignItems: 'flex-end' },
  leaderScoreText: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  leaderBadge: { fontSize: 16 },
  verifyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 8, gap: 12 },
  verifyInfo: { flex: 1 },
  verifyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  verifyDesc: { fontSize: 12, color: colors.accentGreen, marginTop: 2 },
});
