import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const alert = {
    id,
    type: 'road',
    severity: 'medium',
    title: 'Pothole near 5th Cross',
    description: 'Large pothole near the traffic light. Dangerous for two-wheelers, especially at night. Already caused two accidents this week.',
    location: 'Koramangala 5th Block, near Axis Bank ATM',
    area: 'Koramangala',
    credibility: 78,
    status: 'active',
    confirmedBy: 12,
    disputedBy: 2,
    author: { name: 'Rahul M.', trustLevel: 'trusted', trustScore: 156 },
    createdAt: '3 hours ago',
    updatedAt: '1 hour ago',
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.danger;
      case 'high': return colors.accent;
      case 'medium': return colors.accentGold;
      default: return colors.accentGreen;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      road: 'car',
      suspicious: 'eye',
      crime: 'shield',
      hazard: 'warning',
      traffic: 'navigate',
      infrastructure: 'construct',
    };
    return icons[type] || 'alert-circle';
  };

  const severityColor = getSeverityColor(alert.severity);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Alert Header */}
        <View style={styles.header}>
          <View style={[styles.typeIcon, { backgroundColor: severityColor + '20' }]}>
            <Ionicons name={getTypeIcon(alert.type) as any} size={28} color={severityColor} />
          </View>
          <View style={styles.headerInfo}>
            <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {alert.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.title}>{alert.title}</Text>
          </View>
        </View>

        {/* Credibility Score */}
        <View style={styles.credibilityCard}>
          <View style={styles.credibilityScore}>
            <Text style={[styles.credibilityNumber, { color: alert.credibility >= 70 ? colors.accentGreen : alert.credibility >= 50 ? colors.accentGold : colors.danger }]}>
              {alert.credibility}%
            </Text>
            <Text style={styles.credibilityLabel}>Credibility</Text>
          </View>
          <View style={styles.credibilityStats}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accentGreen} />
              <Text style={styles.statNumber}>{alert.confirmedBy}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <Text style={styles.statNumber}>{alert.disputedBy}</Text>
              <Text style={styles.statLabel}>Disputed</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{alert.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.locationCard}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{alert.location}</Text>
              <Text style={styles.locationArea}>{alert.area}</Text>
            </View>
            <Ionicons name="navigate" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Author */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported By</Text>
          <View style={styles.authorCard}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>{alert.author.name[0]}</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{alert.author.name}</Text>
              <View style={styles.authorMeta}>
                <View style={styles.trustBadge}>
                  <Ionicons name="star" size={12} color={colors.accentGold} />
                  <Text style={styles.trustText}>{alert.author.trustLevel}</Text>
                </View>
                <Text style={styles.authorScore}>{alert.author.trustScore} pts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineText}>Reported {alert.createdAt}</Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineText}>Last updated {alert.updatedAt}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmButton}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accentGreen} />
            <Text style={styles.confirmButtonText}>I Can Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.disputeButton}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
            <Text style={styles.disputeButtonText}>This is Wrong</Text>
          </TouchableOpacity>
        </View>

        {/* Report */}
        <TouchableOpacity style={styles.reportButton}>
          <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reportText}>Report this alert</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  typeIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  severityText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  credibilityCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24 },
  credibilityScore: { alignItems: 'center', marginRight: 24 },
  credibilityNumber: { fontSize: 36, fontWeight: 'bold' },
  credibilityLabel: { fontSize: 12, color: colors.textMuted },
  credibilityStats: { flex: 1, justifyContent: 'center', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textMuted },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  description: { fontSize: 15, color: colors.textPrimary, lineHeight: 24 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  locationInfo: { flex: 1 },
  locationText: { fontSize: 14, color: colors.textPrimary },
  locationArea: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  authorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  authorInitial: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  authorMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 12, color: colors.accentGold },
  authorScore: { fontSize: 12, color: colors.textMuted },
  timeline: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 16 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textMuted },
  timelineDotActive: { backgroundColor: colors.primary },
  timelineText: { fontSize: 14, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  confirmButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentGreen + '20', borderRadius: 12, padding: 16, gap: 8 },
  confirmButtonText: { fontSize: 14, fontWeight: '600', color: colors.accentGreen },
  disputeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger + '10', borderRadius: 12, padding: 16, gap: 8 },
  disputeButtonText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  reportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  reportText: { fontSize: 13, color: colors.textMuted },
});
