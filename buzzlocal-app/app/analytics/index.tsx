/**
 * Analytics Screen - City and user analytics dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface CityMetrics {
  activeUsers: number;
  postsToday: number;
  eventsActive: number;
  safetyScore: number;
  checkIns: number;
}

interface TrendData {
  hour: string;
  value: number;
}

interface AreaData {
  name: string;
  users: number;
  growth: number;
  topCategory: string;
}

interface CategoryMetric {
  category: string;
  count: number;
  growth: number;
  icon: string;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [cityMetrics, setCityMetrics] = useState<CityMetrics | null>(null);
  const [userTrends, setUserTrends] = useState<TrendData[]>([]);
  const [areaRankings, setAreaRankings] = useState<AreaData[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetric[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setCityMetrics({
        activeUsers: 12847,
        postsToday: 456,
        eventsActive: 23,
        safetyScore: 87,
        checkIns: 892,
      });

      setUserTrends([
        { hour: '6AM', value: 1200 },
        { hour: '9AM', value: 4500 },
        { hour: '12PM', value: 7800 },
        { hour: '3PM', value: 6200 },
        { hour: '6PM', value: 9200 },
        { hour: '9PM', value: 10500 },
        { hour: '12AM', value: 3500 },
      ]);

      setAreaRankings([
        { name: 'Koramangala', users: 2340, growth: 12.5, topCategory: 'Food' },
        { name: 'Indiranagar', users: 1890, growth: 8.2, topCategory: 'Nightlife' },
        { name: 'HSR Layout', users: 1560, growth: 15.3, topCategory: 'Cafes' },
        { name: 'MG Road', users: 1230, growth: 5.1, topCategory: 'Shopping' },
        { name: 'Whitefield', users: 980, growth: 22.4, topCategory: 'Tech' },
      ]);

      setCategoryMetrics([
        { category: 'Food & Dining', count: 1234, growth: 18.2, icon: 'restaurant' },
        { category: 'Safety Alerts', count: 456, growth: -5.3, icon: 'shield-checkmark' },
        { category: 'Events', count: 789, growth: 25.6, icon: 'calendar' },
        { category: 'Local Deals', count: 2341, growth: 12.8, icon: 'pricetag' },
        { category: 'Area Guides', count: 567, growth: 8.4, icon: 'map' },
      ]);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const maxTrend = Math.max(...userTrends.map((t) => t.value));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>City Analytics</Text>
          <TouchableOpacity>
            <Ionicons name="download-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['day', 'week', 'month'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, selectedTimeRange === range && styles.timeRangeButtonActive]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, selectedTimeRange === range && styles.timeRangeTextActive]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* City Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>City Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="people" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.overviewValue}>{cityMetrics?.activeUsers.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Active Users</Text>
              <View style={styles.trendIndicator}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
                <Text style={styles.trendText}>+12%</Text>
              </View>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name="document-text" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.overviewValue}>{cityMetrics?.postsToday}</Text>
              <Text style={styles.overviewLabel}>Posts Today</Text>
              <View style={styles.trendIndicator}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
                <Text style={styles.trendText}>+8%</Text>
              </View>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: COLORS.accent + '20' }]}>
                <Ionicons name="calendar" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.overviewValue}>{cityMetrics?.eventsActive}</Text>
              <Text style={styles.overviewLabel}>Active Events</Text>
              <View style={styles.trendIndicator}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
                <Text style={styles.trendText}>+15%</Text>
              </View>
            </View>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.overviewValue}>{cityMetrics?.safetyScore}%</Text>
              <Text style={styles.overviewLabel}>Safety Score</Text>
              <View style={styles.trendIndicator}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
                <Text style={styles.trendText}>+3%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Activity Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Trend</Text>
          <View style={styles.trendCard}>
            <View style={styles.trendChart}>
              {userTrends.map((item, index) => (
                <View key={index} style={styles.trendBar}>
                  <View style={styles.trendBarContainer}>
                    <View
                      style={[
                        styles.trendBarFill,
                        { height: `${(item.value / maxTrend) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendLabel}>{item.hour}</Text>
                  <Text style={styles.trendValue}>{item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Area Rankings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Areas</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {areaRankings.map((area, index) => (
            <View key={area.name} style={styles.areaCard}>
              <View style={styles.areaRank}>
                <Text style={styles.areaRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.areaInfo}>
                <Text style={styles.areaName}>{area.name}</Text>
                <View style={styles.areaMeta}>
                  <Text style={styles.areaUsers}>{area.users.toLocaleString()} users</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: COLORS.primaryLight }]}>
                    <Text style={styles.categoryText}>{area.topCategory}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.growthBadge}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
                <Text style={styles.growthText}>+{area.growth}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity by Category</Text>
          {categoryMetrics.map((cat) => (
            <View key={cat.category} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name={cat.icon as any} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryFill,
                      { width: `${(cat.count / 2500) * 100}%` },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryCount}>{cat.count.toLocaleString()}</Text>
                <View style={styles.categoryGrowth}>
                  <Ionicons
                    name={cat.growth >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={cat.growth >= 0 ? COLORS.success : COLORS.error}
                  />
                  <Text style={[styles.categoryGrowthText, { color: cat.growth >= 0 ? COLORS.success : COLORS.error }]}>
                    {Math.abs(cat.growth)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <View style={styles.aiInsightsHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="bulb" size={14} color={COLORS.warning} />
              <Text style={styles.aiBadgeText}>AI Insights</Text>
            </View>
            <Text style={styles.aiPoweredBy}>Powered by REZ Mind</Text>
          </View>
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="trending-up" size={24} color={COLORS.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Peak Activity Hours</Text>
              <Text style={styles.insightDescription}>
                Most activity occurs between 6-9 PM. Consider scheduling important posts during this window for maximum engagement.
              </Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Growth Opportunity</Text>
              <Text style={styles.insightDescription}>
                Whitefield shows 22% growth - highest in the city. Consider increasing creator outreach in this area.
              </Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Event Trend</Text>
              <Text style={styles.insightDescription}>
                Food-related events are trending 25% higher than last month. Partner with local restaurants for collaborative campaigns.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in Stats</Text>
          <View style={styles.checkinCard}>
            <View style={styles.checkinHeader}>
              <View>
                <Text style={styles.checkinValue}>{cityMetrics?.checkIns.toLocaleString()}</Text>
                <Text style={styles.checkinLabel}>Total Check-ins</Text>
              </View>
              <View style={styles.checkinBreakdown}>
                <View style={styles.checkinItem}>
                  <View style={[styles.checkinDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.checkinItemLabel}>Food: 45%</Text>
                </View>
                <View style={styles.checkinItem}>
                  <View style={[styles.checkinDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.checkinItemLabel}>Shopping: 25%</Text>
                </View>
                <View style={styles.checkinItem}>
                  <View style={[styles.checkinDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.checkinItemLabel}>Entertainment: 30%</Text>
                </View>
              </View>
            </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  timeRangeTextActive: {
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  overviewCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  overviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  overviewValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  overviewLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '500',
  },
  trendCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-between',
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
  },
  trendBarContainer: {
    width: 20,
    height: 80,
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  trendValue: {
    fontSize: 9,
    color: COLORS.text,
    fontWeight: '600',
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  areaRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  areaRankText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  areaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  areaUsers: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '500',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.success,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  categoryStats: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
  },
  categoryCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  categoryGrowthText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  aiBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  aiPoweredBy: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  insightDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  checkinCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  checkinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkinValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkinLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  checkinBreakdown: {
    gap: SPACING.sm,
  },
  checkinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkinItemLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});
