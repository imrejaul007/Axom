/**
 * Merchant Insights Screen - Detailed analytics and footfall predictions
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

interface FootfallData {
  date: string;
  value: number;
}

interface PredictionData {
  day: string;
  predicted: number;
  confidence: number;
}

interface AreaMetrics {
  areaName: string;
  footfall: number;
  trend: 'up' | 'down' | 'stable';
  peakHour: string;
}

type TimeRange = 'today' | 'week' | 'month';

export default function MerchantInsightsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [footfallData, setFootfallData] = useState<FootfallData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [areaMetrics, setAreaMetrics] = useState<AreaMetrics[]>([]);
  const [summary, setSummary] = useState({
    totalFootfall: 0,
    avgDaily: 0,
    peakHour: '',
    conversionRate: 0,
  });

  useEffect(() => {
    fetchInsightsData();
  }, [timeRange]);

  const fetchInsightsData = async () => {
    try {
      // Mock data - replace with actual API call
      const weeklyFootfall = [
        { date: 'Mon', value: 189 },
        { date: 'Tue', value: 210 },
        { date: 'Wed', value: 195 },
        { date: 'Thu', value: 234 },
        { date: 'Fri', value: 267 },
        { date: 'Sat', value: 312 },
        { date: 'Sun', value: 178 },
      ];

      const monthlyFootfall = [
        { date: 'Week 1', value: 1585 },
        { date: 'Week 2', value: 1723 },
        { date: 'Week 3', value: 1654 },
        { date: 'Week 4', value: 1891 },
      ];

      const todayFootfall = [
        { date: '9AM', value: 45 },
        { date: '10AM', value: 62 },
        { date: '11AM', value: 78 },
        { date: '12PM', value: 95 },
        { date: '1PM', value: 88 },
        { date: '2PM', value: 65 },
        { date: '5PM', value: 112 },
        { date: '6PM', value: 145 },
        { date: '7PM', value: 156 },
        { date: '8PM', value: 134 },
      ];

      setFootfallData(timeRange === 'today' ? todayFootfall : timeRange === 'week' ? weeklyFootfall : monthlyFootfall);

      setPredictions([
        { day: 'Tomorrow', predicted: 245, confidence: 92 },
        { day: 'Friday', predicted: 289, confidence: 88 },
        { day: 'Saturday', predicted: 356, confidence: 85 },
        { day: 'Sunday', predicted: 198, confidence: 82 },
        { day: 'Next Week', predicted: 234, confidence: 78 },
      ]);

      setAreaMetrics([
        { areaName: 'Koramangala 5th Block', footfall: 89, trend: 'up', peakHour: '7 PM' },
        { areaName: 'HSR Layout', footfall: 67, trend: 'up', peakHour: '12 PM' },
        { areaName: 'Indiranagar', footfall: 54, trend: 'stable', peakHour: '8 PM' },
        { areaName: 'BTM Layout', footfall: 34, trend: 'down', peakHour: '1 PM' },
      ]);

      setSummary({
        totalFootfall: timeRange === 'today' ? 980 : timeRange === 'week' ? 1585 : 6853,
        avgDaily: timeRange === 'today' ? 980 : timeRange === 'week' ? 226 : 196,
        peakHour: '7:00 PM',
        conversionRate: 12.5,
      });
    } catch (error) {
      console.error('Failed to fetch insights data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInsightsData();
    setRefreshing(false);
  };

  const maxFootfall = Math.max(...footfallData.map((d) => d.value));

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
          <Text style={styles.headerTitle}>Insights</Text>
          <TouchableOpacity>
            <Ionicons name="download-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.section}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Footfall</Text>
              <Text style={styles.summaryValue}>{summary.totalFootfall.toLocaleString()}</Text>
              <View style={styles.summaryTrend}>
                <Ionicons name="arrow-up" size={14} color={COLORS.success} />
                <Text style={styles.trendText}>+12.5%</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Daily Average</Text>
              <Text style={styles.summaryValue}>{summary.avgDaily}</Text>
              <View style={styles.summaryTrend}>
                <Ionicons name="arrow-up" size={14} color={COLORS.success} />
                <Text style={styles.trendText}>+8.2%</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Peak Hour</Text>
              <Text style={styles.summaryValue}>{summary.peakHour}</Text>
              <View style={styles.summaryTrend}>
                <Ionicons name="time" size={14} color={COLORS.primary} />
                <Text style={styles.trendText}>Best time</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Conversion</Text>
              <Text style={styles.summaryValue}>{summary.conversionRate}%</Text>
              <View style={styles.summaryTrend}>
                <Ionicons name="arrow-up" size={14} color={COLORS.success} />
                <Text style={styles.trendText}>+2.1%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footfall Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Footfall Trend</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {footfallData.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(item.value / maxFootfall) * 100}%`,
                          backgroundColor: index === footfallData.length - 1 ? COLORS.primary : COLORS.primaryLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.date}</Text>
                  <Text style={styles.barValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Predictions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Predictions</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="bulb" size={14} color={COLORS.warning} />
              <Text style={styles.aiBadgeText}>REZ Mind</Text>
            </View>
          </View>
          <View style={styles.predictionsList}>
            {predictions.map((pred, index) => (
              <View key={index} style={styles.predictionCard}>
                <View style={styles.predictionLeft}>
                  <Text style={styles.predictionDay}>{pred.day}</Text>
                  <View style={styles.confidenceBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={styles.confidenceText}>{pred.confidence}% confidence</Text>
                  </View>
                </View>
                <View style={styles.predictionRight}>
                  <Text style={styles.predictionValue}>{pred.predicted}</Text>
                  <Text style={styles.predictionLabel}>expected</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Area Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Footfall by Area</Text>
          {areaMetrics.map((area, index) => (
            <View key={index} style={styles.areaCard}>
              <View style={styles.areaInfo}>
                <Text style={styles.areaName}>{area.areaName}</Text>
                <Text style={styles.areaMeta}>Peak: {area.peakHour}</Text>
              </View>
              <View style={styles.areaStats}>
                <View style={styles.footfallBar}>
                  <View
                    style={[
                      styles.footfallFill,
                      { width: `${area.footfall}%`, backgroundColor: COLORS.primary },
                    ]}
                  />
                </View>
                <Text style={styles.footfallValue}>{area.footfall}%</Text>
                <Ionicons
                  name={area.trend === 'up' ? 'trending-up' : area.trend === 'down' ? 'trending-down' : 'remove'}
                  size={16}
                  color={area.trend === 'up' ? COLORS.success : area.trend === 'down' ? COLORS.error : COLORS.textSecondary}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationCard}>
            <View style={[styles.recommendationIcon, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="restaurant" size={24} color={COLORS.success} />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Add Lunch Special</Text>
              <Text style={styles.recommendationText}>
                Your HSR Layout customers peak at lunch. Consider adding a lunch combo deal.
              </Text>
            </View>
          </View>
          <View style={styles.recommendationCard}>
            <View style={[styles.recommendationIcon, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Extend Friday Hours</Text>
              <Text style={styles.recommendationText}>
                Friday evenings show 40% higher demand. Consider staying open until 10 PM.
              </Text>
            </View>
          </View>
          <View style={styles.recommendationCard}>
            <View style={[styles.recommendationIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="pricetag" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Weekend Deals</Text>
              <Text style={styles.recommendationText}>
                Saturday sees peak footfall. A weekend-only offer could boost conversions by 15%.
              </Text>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  summaryCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  summaryTrend: {
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
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    justifyContent: 'space-between',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: 20,
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '600',
  },
  predictionsList: {
    gap: SPACING.sm,
  },
  predictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  predictionLeft: {
    flex: 1,
  },
  predictionDay: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  confidenceText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
  },
  predictionRight: {
    alignItems: 'flex-end',
  },
  predictionValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  predictionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  areaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footfallBar: {
    width: 60,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  footfallFill: {
    height: '100%',
    borderRadius: 4,
  },
  footfallValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    width: 30,
    textAlign: 'right',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recommendationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
