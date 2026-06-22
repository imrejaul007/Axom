/**
 * Merchant Dashboard - Analytics and insights for local businesses
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

interface MerchantStats {
  todayFootfall: number;
  footfallChange: number;
  activeDeals: number;
  totalViews: number;
  followers: number;
  rating: number;
}

interface DemandPrediction {
  hour: number;
  predicted: number;
  actual: number;
}

interface CompetitorData {
  name: string;
  distance: string;
  crowdLevel: number;
  deals: number;
}

interface InsightItem {
  icon: string;
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
}

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API call
      setStats({
        todayFootfall: 234,
        footfallChange: 12.5,
        activeDeals: 3,
        totalViews: 1856,
        followers: 456,
        rating: 4.7,
      });

      setPredictions([
        { hour: 10, predicted: 45, actual: 42 },
        { hour: 11, predicted: 55, actual: 58 },
        { hour: 12, predicted: 85, actual: 78 },
        { hour: 13, predicted: 65, actual: 70 },
        { hour: 14, predicted: 50, actual: 48 },
        { hour: 15, predicted: 40, actual: 44 },
        { hour: 18, predicted: 90, actual: 0 },
        { hour: 19, predicted: 95, actual: 0 },
        { hour: 20, predicted: 75, actual: 0 },
      ]);

      setCompetitors([
        { name: 'Cafe Coffee Day', distance: '0.3 km', crowdLevel: 75, deals: 2 },
        { name: 'Starbucks', distance: '0.5 km', crowdLevel: 60, deals: 1 },
        { name: 'Blue Tokai', distance: '0.7 km', crowdLevel: 45, deals: 3 },
      ]);

      setInsights([
        { icon: 'time', title: 'Peak Hours Alert', description: '6-8 PM is your busiest time. Consider extra staff.', impact: 'positive' },
        { icon: 'trending-up', title: 'Rising Demand', description: 'Footfall up 12.5% this week vs last week.', impact: 'positive' },
        { icon: 'warning', title: 'Competitor Activity', description: '2 new cafes opened within 1km radius.', impact: 'negative' },
        { icon: 'star', title: 'Review Spike', description: 'You received 8 new 5-star reviews yesterday!', impact: 'positive' },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return COLORS.success;
      case 'negative': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return 'arrow-up-circle';
      case 'negative': return 'arrow-down-circle';
      default: return 'alert-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Merchant Dashboard</Text>
            <Text style={styles.headerSubtitle}>Your business insights</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <Ionicons name="footsteps" size={24} color={COLORS.primary} />
              <Text style={styles.quickStatValue}>{stats?.todayFootfall}</Text>
              <Text style={styles.quickStatLabel}>Today's Footfall</Text>
              {stats && stats.footfallChange > 0 && (
                <View style={styles.changeBadge}>
                  <Ionicons name="arrow-up" size={12} color={COLORS.success} />
                  <Text style={styles.changeText}>+{stats.footfallChange}%</Text>
                </View>
              )}
            </View>
            <View style={styles.quickStatCard}>
              <Ionicons name="pricetag" size={24} color={COLORS.warning} />
              <Text style={styles.quickStatValue}>{stats?.activeDeals}</Text>
              <Text style={styles.quickStatLabel}>Active Deals</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Ionicons name="eye" size={24} color={COLORS.primary} />
              <Text style={styles.quickStatValue}>{stats?.totalViews}</Text>
              <Text style={styles.quickStatLabel}>Views</Text>
            </View>
          </View>
          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStatItem}>
              <Ionicons name="people" size={18} color={COLORS.textSecondary} />
              <Text style={styles.secondaryStatValue}>{stats?.followers}</Text>
              <Text style={styles.secondaryStatLabel}>Followers</Text>
            </View>
            <View style={styles.secondaryStatDivider} />
            <View style={styles.secondaryStatItem}>
              <Ionicons name="star" size={18} color={COLORS.warning} />
              <Text style={styles.secondaryStatValue}>{stats?.rating}</Text>
              <Text style={styles.secondaryStatLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Demand Prediction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Demand Prediction</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.predictionCard}>
            <Text style={styles.predictionSubtitle}>Today's footfall prediction vs actual</Text>
            <View style={styles.predictionChart}>
              {predictions.map((item) => (
                <View key={item.hour} style={styles.predictionBar}>
                  <View style={styles.barContainer}>
                    {item.actual > 0 && (
                      <View
                        style={[
                          styles.actualBar,
                          { height: `${item.actual}%`, backgroundColor: COLORS.primary },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.predictedBar,
                        { height: `${item.predicted}%`, backgroundColor: COLORS.primaryLight },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourLabel}>{item.hour}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Actual</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight }]} />
                <Text style={styles.legendText}>Predicted</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Optimal Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optimal Times to Open</Text>
          <View style={styles.timesCard}>
            <View style={styles.optimalTimeItem}>
              <View style={[styles.timeIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="sunny" size={20} color={COLORS.success} />
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Best Lunch</Text>
                <Text style={styles.timeValue}>12:00 PM - 2:00 PM</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>High</Text>
              </View>
            </View>
            <View style={styles.optimalTimeItem}>
              <View style={[styles.timeIcon, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name="moon" size={20} color={COLORS.warning} />
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Best Dinner</Text>
                <Text style={styles.timeValue}>7:00 PM - 9:00 PM</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>High</Text>
              </View>
            </View>
            <View style={styles.optimalTimeItem}>
              <View style={[styles.timeIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="partly-sunny" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Avoid</Text>
                <Text style={styles.timeValue}>3:00 PM - 5:00 PM</Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: COLORS.errorLight }]}>
                <Text style={[styles.confidenceText, { color: COLORS.error }]}>Low</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Competitor Analysis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Competitors</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Analysis</Text>
            </TouchableOpacity>
          </View>
          {competitors.map((comp, index) => (
            <View key={index} style={styles.competitorCard}>
              <View style={styles.competitorInfo}>
                <Text style={styles.competitorName}>{comp.name}</Text>
                <Text style={styles.competitorDistance}>{comp.distance} away</Text>
              </View>
              <View style={styles.competitorStats}>
                <View style={styles.competitorStat}>
                  <View style={styles.crowdIndicator}>
                    <View
                      style={[
                        styles.crowdBar,
                        { height: `${comp.crowdLevel}%`, backgroundColor: comp.crowdLevel > 60 ? COLORS.error : COLORS.warning },
                      ]}
                    />
                  </View>
                  <Text style={styles.crowdText}>{comp.crowdLevel}%</Text>
                </View>
                <View style={styles.competitorDealBadge}>
                  <Ionicons name="pricetag" size={12} color={COLORS.warning} />
                  <Text style={styles.dealCount}>{comp.deals}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="bulb" size={14} color={COLORS.warning} />
              <Text style={styles.aiBadgeText}>Powered by REZ Mind</Text>
            </View>
          </View>
          {insights.map((insight, index) => (
            <TouchableOpacity key={index} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: getImpactColor(insight.impact) + '20' }]}>
                <Ionicons name={getImpactIcon(insight.impact) as any} size={20} color={getImpactColor(insight.impact)} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="add-circle" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.actionLabel}>Create Deal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="qr-code" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name="analytics" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.errorLight }]}>
                <Ionicons name="megaphone" size={24} color={COLORS.error} />
              </View>
              <Text style={styles.actionLabel}>Promote</Text>
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
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    padding: SPACING.sm,
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
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  quickStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  changeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  secondaryStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    justifyContent: 'center',
  },
  secondaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  secondaryStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  secondaryStatValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  secondaryStatLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  predictionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  predictionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  predictionChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    justifyContent: 'space-between',
  },
  predictionBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 16,
    height: 80,
    justifyContent: 'flex-end',
  },
  actualBar: {
    width: '100%',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  predictedBar: {
    width: '100%',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
    opacity: 0.5,
  },
  hourLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  timesCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  optimalTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  timeValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  confidenceBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  competitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  competitorInfo: {
    flex: 1,
  },
  competitorName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  competitorDistance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  competitorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  competitorStat: {
    alignItems: 'center',
  },
  crowdIndicator: {
    width: 24,
    height: 40,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  crowdBar: {
    width: '100%',
    borderRadius: 4,
  },
  crowdText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  competitorDealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  dealCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  bottomPadding: {
    height: 100,
  },
});
