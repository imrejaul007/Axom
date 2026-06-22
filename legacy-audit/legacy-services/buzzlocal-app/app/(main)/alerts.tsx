/**
 * Safety Alerts - View all safety alerts in the area
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface Alert {
  id: string;
  type: 'safety' | 'weather' | 'crime' | 'traffic' | 'emergency';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  time: Date;
  verified: boolean;
  source: string;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'crime',
    title: 'Theft Reported in Indiranagar',
    description: 'Multiple mobile thefts reported near 100ft Road. Please be vigilant with your belongings.',
    severity: 'high',
    location: 'Indiranagar, 100ft Road',
    time: new Date(Date.now() - 3600000 * 2),
    verified: true,
    source: 'Local Police',
  },
  {
    id: '2',
    type: 'weather',
    title: 'Heavy Rain Alert',
    description: 'Heavy rainfall expected in Bangalore. Avoid low-lying areas and waterlogged roads.',
    severity: 'medium',
    location: 'All Areas',
    time: new Date(Date.now() - 3600000 * 4),
    verified: true,
    source: 'IMD',
  },
  {
    id: '3',
    type: 'traffic',
    title: 'Road Closure on MG Road',
    description: 'MG Road closed for maintenance. Use alternative routes via Residency Road.',
    severity: 'low',
    location: 'MG Road',
    time: new Date(Date.now() - 3600000 * 6),
    verified: true,
    source: 'Traffic Police',
  },
  {
    id: '4',
    type: 'emergency',
    title: 'Medical Emergency - Hospital Full',
    description: 'Manipal Hospital ICU at capacity. Consider alternate hospitals for emergencies.',
    severity: 'critical',
    location: 'Koramangala',
    time: new Date(Date.now() - 3600000 * 8),
    verified: true,
    source: 'BBMP',
  },
  {
    id: '5',
    type: 'safety',
    title: 'Street Light Outage - HSR Sector 2',
    description: 'Multiple street lights not working. Exercise caution when walking at night.',
    severity: 'medium',
    location: 'HSR Layout, Sector 2',
    time: new Date(Date.now() - 86400000),
    verified: false,
    source: 'Community Report',
  },
];

const TYPE_CONFIG = {
  safety: { icon: 'shield', color: '#3B82F6' },
  weather: { icon: 'cloud', color: '#6B7280' },
  crime: { icon: 'alert-circle', color: '#EF4444' },
  traffic: { icon: 'car', color: '#F97316' },
  emergency: { icon: 'warning', color: '#DC2626' },
};

const SEVERITY_CONFIG = {
  low: { color: '#10B981', label: 'Low' },
  medium: { color: '#FBBF24', label: 'Medium' },
  high: { color: '#F97316', label: 'High' },
  critical: { color: '#EF4444', label: 'Critical' },
};

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredAlerts = selectedType
    ? alerts.filter((a) => a.type === selectedType)
    : alerts;

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAlertPress = (alert: Alert) => {
    router.push(`/alerts/${alert.id}`);
  };

  const handleSOS = () => {
    router.push('/safe/sos');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    const typeConfig = TYPE_CONFIG[item.type];
    const severityConfig = SEVERITY_CONFIG[item.severity];

    return (
      <TouchableOpacity style={styles.alertCard} onPress={() => handleAlertPress(item)}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: typeConfig.color + '20' }]}>
            <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
          </View>
          <View style={styles.alertInfo}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                </View>
              )}
            </View>
            <Text style={styles.alertSource}>{item.source}</Text>
          </View>
          <View
            style={[styles.severityBadge, { backgroundColor: severityConfig.color + '20' }]}
          >
            <Text style={[styles.severityText, { color: severityConfig.color }]}>
              {severityConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.alertDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.alertFooter}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTime(item.time)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Alerts</Text>
        <TouchableOpacity onPress={handleSOS}>
          <View style={[styles.sosButton, criticalCount > 0 && styles.sosButtonAlert]}>
            <Ionicons name="warning" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <View style={styles.criticalBanner}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.criticalBannerText}>
            {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} in your area
          </Text>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={[null, 'safety', 'crime', 'weather', 'traffic', 'emergency']}
          keyExtractor={(item) => item || 'all'}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item && styles.filterChipActive,
                item && { borderColor: TYPE_CONFIG[item as keyof typeof TYPE_CONFIG]?.color, borderWidth: 1 },
              ]}
              onPress={() => setSelectedType(item)}
            >
              {item && (
                <Ionicons
                  name={TYPE_CONFIG[item as keyof typeof TYPE_CONFIG]?.icon as any}
                  size={14}
                  color={selectedType === item ? '#fff' : TYPE_CONFIG[item as keyof typeof TYPE_CONFIG]?.color}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === item && styles.filterChipTextActive,
                  item && !selectedType?.includes(item) && {
                    color: TYPE_CONFIG[item as keyof typeof TYPE_CONFIG]?.color,
                  },
                ]}
              >
                {item ? item.charAt(0).toUpperCase() + item.slice(1) : 'All'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>
              No {selectedType || ''} alerts in your area right now.
            </Text>
          </View>
        }
      />
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
  sosButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonAlert: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#fff',
  },
  criticalBanner: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  criticalBannerText: {
    fontSize: FONT_SIZE.sm,
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  alertCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  alertSource: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  severityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    flex: 1,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
