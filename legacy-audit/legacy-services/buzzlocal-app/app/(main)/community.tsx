import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'societies' | 'groups'>('societies');

  const mySocieties = [
    {
      id: '1',
      name: 'Brigade Garden Enclave',
      type: 'gated',
      members: 156,
      unread: 3,
      latest: 'Admin: Water supply will be disrupted tomorrow...'
    },
    {
      id: '2',
      name: 'Koramangala Foodies',
      type: 'interest',
      members: 234,
      unread: 0,
      latest: 'New restaurant opened near 5th Block!'
    }
  ];

  const nearbyGroups = [
    { id: '1', name: 'Nightlife Explorers', members: 892, category: 'Events' },
    { id: '2', name: 'Tech Meetups BLR', members: 1243, category: 'Tech' },
    { id: '3', name: 'Koramangala Parents', members: 567, category: 'Community' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'societies' && styles.tabActive]}
          onPress={() => setActiveTab('societies')}
        >
          <Ionicons
            name="home"
            size={18}
            color={activeTab === 'societies' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'societies' && styles.tabTextActive]}>
            My Societies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'groups' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Societies Tab */}
      {activeTab === 'societies' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Apartments & Societies</Text>

          {/* Society Card */}
          {mySocieties.map((society) => (
            <TouchableOpacity
              key={society.id}
              style={styles.societyCard}
              onPress={() => router.push(`/society/${society.id}` as string)}
            >
              <View style={styles.societyIcon}>
                <Ionicons
                  name={society.type === 'gated' ? 'shield' : 'home'}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.societyInfo}>
                <Text style={styles.societyName}>{society.name}</Text>
                <Text style={styles.societyMembers}>{society.members} members</Text>
                <Text style={styles.societyLatest} numberOfLines={1}>{society.latest}</Text>
              </View>
              {society.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{society.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Society Features</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="megaphone" size={20} color={colors.accent} />
              </View>
              <Text style={styles.quickActionText}>Announcements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Book Facilities</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accentGreen + '20' }]}>
                <Ionicons name="car" size={20} color={colors.accentGreen} />
              </View>
              <Text style={styles.quickActionText}>Visitors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EC4899' + '20' }]}>
                <Ionicons name="construct" size={20} color="#EC4899" />
              </View>
              <Text style={styles.quickActionText}>Maintenance</Text>
            </TouchableOpacity>
          </View>

          {/* Find New Society */}
          <TouchableOpacity style={styles.findSociety}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <Text style={styles.findText}>Find your society or apartment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Groups</Text>

          {nearbyGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => router.push(`/group/${group.id}` as string)}
            >
              <View style={styles.groupIcon}>
                <Ionicons name="people" size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.groupMeta}>
                  <Text style={styles.groupMembers}>{group.members} members</Text>
                  <View style={styles.groupCategory}>
                    <Text style={styles.groupCategoryText}>{group.category}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.discoverMore}>
            <Text style={styles.discoverMoreText}>Discover More Groups</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  createText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.surfaceLight,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  societyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  societyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  societyInfo: {
    flex: 1,
  },
  societyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  societyMembers: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  societyLatest: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  findSociety: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    borderStyle: 'dashed',
    gap: 8,
  },
  findText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  groupMembers: {
    fontSize: 12,
    color: colors.textMuted,
  },
  groupCategory: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupCategoryText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  discoverMore: {
    alignItems: 'center',
    padding: 16,
  },
  discoverMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
