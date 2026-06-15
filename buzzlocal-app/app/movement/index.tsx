/**
 * Movement Screen - BuzzLocal City OS
 *
 * Shows user's movement patterns, commute detection, and area flows.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store';

const { width } = Dimensions.get('window');

interface MovementData {
  commutePattern: {
    homeArea: string;
    workArea: string;
    departureTime: string;
    arrivalTime: string;
    confidence: number;
  } | null;
  recentAreas: { areaId: string; areaName: string; visits: number; lastVisit: string }[];
  hotSpots: { areaId: string; areaName: string; density: number; trend: 'rising' | 'stable' | 'falling' }[];
  trends: { hour: number; movement: number }[];
}

export default function MovementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MovementData | null>(null);

  useEffect(() => {
    fetchMovementData();
  }, []);

  const fetchMovementData = async () => {
    try {
      // Mock data - replace with actual API call
      setData({
        commutePattern: {
          homeArea: 'Koramangala',
          workArea: 'MG Road',
          departureTime: '9:00 AM',
          arrivalTime: '6:30 PM',
          confidence: 0.85,
        },
        recentAreas: [
          { areaId: '1', areaName: 'Koramangala', visits: 45, lastVisit: '2 hours ago' },
          { areaId: '2', areaName: 'Indiranagar', visits: 23, lastVisit: 'Yesterday' },
          { areaId: '3', areaName: 'HSR Layout', visits: 18, lastVisit: '2 days ago' },
          { areaId: '4', areaName: 'Whitefield', visits: 12, lastVisit: '3 days ago' },
          { areaId: '5', areaName: 'Electronic City', visits: 8, lastVisit: '5 days ago' },
        ],
        hotSpots: [
          { areaId: '1', areaName: 'Forum Mall', density: 92, trend: 'rising' },
          { areaId: '2', areaName: 'UB City', density: 78, trend: 'stable' },
          { areaId: '3', areaName: 'Phoenix Marketcity', density: 65, trend: 'falling' },
        ],
        trends: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          movement: Math.sin(i / 3) * 50 + 50 + Math.random() * 20,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch movement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'rising' | 'stable' | 'falling') => {
    switch (trend) {
      case 'rising':
        return <Ionicons name="trending-up" size={16} color={COLORS.success} />;
      case 'falling':
        return <Ionicons name="trending-down" size={16} color={COLORS.error} />;
      default:
        return <Ionicons name="remove-outline" size={16} color={COLORS.textSecondary} />;
    }
  };

  const getDensityColor = (density: number) => {
    if (density >= 80) return COLORS.error;
    if (density >= 50) return COLORS.warning;
    return COLORS.success;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Analyzing your movement patterns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Movement</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Commute Pattern */}
        {data?.commutePattern && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Daily Commute</Text>
            <View style={styles.commuteCard}>
              <View style={styles.commuteRoute}>
                <View style={styles.commutePoint}>
                  <View style={[styles.commuteDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.commuteLabel}>Home</Text>
                  <Text style={styles.commuteArea}>{data.commutePattern.homeArea}</Text>
                </View>
                <View style={styles.commuteLine}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.commutePoint}>
                  <View style={[styles.commuteDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.commuteLabel}>Work</Text>
                  <Text style={styles.commuteArea}>{data.commutePattern.workArea}</Text>
                </View>
              </View>
              <View style={styles.commuteTimes}>
                <View style={styles.commuteTimeItem}>
                  <Ionicons name="sunny-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.commuteTime}>{data.commutePattern.departureTime}</Text>
                </View>
                <View style={styles.commuteTimeItem}>
                  <Ionicons name="moon-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.commuteTime}>{data.commutePattern.arrivalTime}</Text>
                </View>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <Text style={styles.confidenceValue}>
                  {Math.round(data.commutePattern.confidence * 100)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Movement Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>24-Hour Activity</Text>
          <View style={styles.trendsChart}>
            {data?.trends.slice(6, 22).map((item) => (
              <View key={item.hour} style={styles.trendBar}>
                <View
                  style={[
                    styles.trendBarFill,
                    {
                      height: `${item.movement}%`,
                      backgroundColor:
                        item.movement > 70
                          ? COLORS.error
                          : item.movement > 40
                          ? COLORS.warning
                          : COLORS.success,
                    },
                  ]}
                />
                {item.hour % 4 === 0 && (
                  <Text style={styles.trendLabel}>{`${item.hour}:00`}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Hot Spots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Hot Spots</Text>
          {data?.hotSpots.map((spot) => (
            <TouchableOpacity key={spot.areaId} style={styles.hotSpotCard}>
              <View style={styles.hotSpotInfo}>
                <Text style={styles.hotSpotName}>{spot.areaName}</Text>
                <View style={styles.densityBadge}>
                  <View
                    style={[
                      styles.densityDot,
                      { backgroundColor: getDensityColor(spot.density) },
                    ]}
                  />
                  <Text style={styles.densityText}>{spot.density}% crowded</Text>
                </View>
              </View>
              {getTrendIcon(spot.trend)}
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Visited</Text>
          {data?.recentAreas.map((area, index) => (
            <View key={area.areaId} style={styles.recentAreaCard}>
              <View style={styles.recentAreaRank}>
                <Text style={styles.recentAreaRankText}>{index + 1}</Text>
              </View>
              <View style={styles.recentAreaInfo}>
                <Text style={styles.recentAreaName}>{area.areaName}</Text>
                <Text style={styles.recentAreaMeta}>
                  {area.visits} visits · Last: {area.lastVisit}
                </Text>
              </View>
              <TouchableOpacity style={styles.recentAreaAction}>
                <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Peak Hours</Text>
              <Text style={styles.insightText}>
                Most activity in your area happens between 12-2 PM and 6-8 PM.
                Consider visiting during off-peak for less crowded experience.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
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
  commuteCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  commuteRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  commutePoint: {
    alignItems: 'center',
    flex: 1,
  },
  commuteDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  commuteLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  commuteArea: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  commuteLine: {
    flex: 1,
    alignItems: 'center',
  },
  commuteTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  commuteTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  commuteTime: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  confidenceBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confidenceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  confidenceValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trendsChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  hotSpotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  hotSpotInfo: {
    flex: 1,
  },
  hotSpotName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  densityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  densityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  densityText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  recentAreaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recentAreaRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  recentAreaRankText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recentAreaInfo: {
    flex: 1,
  },
  recentAreaName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentAreaMeta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  recentAreaAction: {
    padding: SPACING.sm,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  insightText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
