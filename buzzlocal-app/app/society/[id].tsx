import React, { useState } from 'react';
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

const ANNOUNCEMENTS = [
  { id: '1', title: 'Water Supply Disruption', content: 'Water supply will be disrupted tomorrow from 9 AM to 5 PM for maintenance work. Please store water in advance.', author: 'Admin', time: '2 hours ago', priority: 'urgent' },
  { id: '2', title: 'New Gym Equipment', content: 'The society gym has new equipment. All residents can now use it from 5 AM to 11 PM.', author: 'Secretary', time: '1 day ago', priority: 'normal' },
  { id: '3', title: 'Festival Celebration', content: 'Diwali celebration in society grounds on 20th. All families welcome!', author: 'Admin', time: '3 days ago', priority: 'important' },
];

export default function SocietyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'facilities'>('feed');

  const society = {
    id,
    name: 'Brigade Garden Enclave',
    type: 'gated',
    memberCount: 156,
    yourRole: 'resident',
    yourFlat: 'B-204',
  };

  const facilities = [
    { name: 'Club House', available: true, slots: '9 AM - 9 PM' },
    { name: 'Gym', available: true, slots: '5 AM - 11 PM' },
    { name: 'Swimming Pool', available: false, slots: 'Closed for maintenance' },
    { name: 'Tennis Court', available: true, slots: '6 AM - 9 PM' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.societyName}>{society.name}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{society.yourRole.toUpperCase()} • {society.yourFlat}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="megaphone" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Announce</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/society/visitors?id=${id}&societyName=${society.name}`)}>
            <Ionicons name="people" size={24} color={colors.accentGreen} />
            <Text style={styles.actionText}>Visitor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="construct" size={24} color={colors.accentGold} />
            <Text style={styles.actionText}>Maintain</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'feed' && styles.tabActive]} onPress={() => setActiveTab('feed')}>
            <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'members' && styles.tabActive]} onPress={() => setActiveTab('members')}>
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'facilities' && styles.tabActive]} onPress={() => setActiveTab('facilities')}>
            <Text style={[styles.tabText, activeTab === 'facilities' && styles.tabTextActive]}>Facilities</Text>
          </TouchableOpacity>
        </View>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <View style={styles.feed}>
            {ANNOUNCEMENTS.map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={[styles.priorityDot, { backgroundColor: announcement.priority === 'urgent' ? colors.danger : announcement.priority === 'important' ? colors.accent : colors.primary }]} />
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                </View>
                <Text style={styles.announcementContent}>{announcement.content}</Text>
                <View style={styles.announcementFooter}>
                  <Text style={styles.announcementAuthor}>{announcement.author}</Text>
                  <Text style={styles.announcementTime}>{announcement.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.members}>
            <View style={styles.memberStats}>
              <Text style={styles.memberCount}>{society.memberCount}</Text>
              <Text style={styles.memberLabel}>Members</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Members</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Facilities Tab */}
        {activeTab === 'facilities' && (
          <View style={styles.facilities}>
            {facilities.map((facility, index) => (
              <View key={index} style={styles.facilityCard}>
                <View style={styles.facilityInfo}>
                  <Text style={styles.facilityName}>{facility.name}</Text>
                  <Text style={styles.facilitySlots}>{facility.slots}</Text>
                </View>
                <View style={[styles.facilityStatus, facility.available ? styles.statusAvailable : styles.statusUnavailable]}>
                  <Text style={[styles.statusText, facility.available ? styles.statusTextAvailable : styles.statusTextUnavailable]}>
                    {facility.available ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
                {facility.available && (
                  <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backButton: {},
  headerInfo: { flex: 1 },
  societyName: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roleBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  settingsButton: { padding: 8 },
  quickActions: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 20, gap: 8 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionText: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.surfaceLight },
  tabText: { fontSize: 14, color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  feed: { gap: 12 },
  announcementCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  announcementHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  announcementTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  announcementContent: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  announcementFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  announcementAuthor: { fontSize: 12, color: colors.primary },
  announcementTime: { fontSize: 12, color: colors.textMuted },
  members: { alignItems: 'center' },
  memberStats: { alignItems: 'center', marginBottom: 20 },
  memberCount: { fontSize: 48, fontWeight: 'bold', color: colors.textPrimary },
  memberLabel: { fontSize: 14, color: colors.textMuted },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 8 },
  viewAllText: { fontSize: 14, color: colors.primary },
  facilities: { gap: 12 },
  facilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  facilitySlots: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  facilityStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusAvailable: { backgroundColor: colors.accentGreen + '20' },
  statusUnavailable: { backgroundColor: colors.danger + '20' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextAvailable: { color: colors.accentGreen },
  statusTextUnavailable: { color: colors.danger },
  bookButton: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bookButtonText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
});
