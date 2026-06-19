/**
 * Business Networking Screen
 * Founder, Investor, Mentor matching
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#0f0f23',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

interface NetworkProfile {
  id: string;
  name: string;
  role: string;
  company?: string;
  type: 'founder' | 'investor' | 'mentor' | 'freelancer';
  industry: string[];
  lookingFor: string[];
  stage?: string;
  pitch?: string;
  avatar?: string;
}

const mockProfiles: NetworkProfile[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Founder & CEO',
    company: 'TechVision AI',
    type: 'founder',
    industry: ['AI/ML', 'SaaS'],
    lookingFor: ['Seed funding', 'Co-founders'],
    stage: 'Pre-seed',
    pitch: 'Building AI-powered customer support for enterprises',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    role: 'Angel Investor',
    type: 'investor',
    industry: ['Fintech', 'E-commerce'],
    lookingFor: ['Early stage startups', 'B2B SaaS'],
    stage: 'Angel check: ₹5-50L',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  },
  {
    id: '3',
    name: 'Ananya Patel',
    role: 'Startup Mentor',
    type: 'mentor',
    company: 'Ex-Google, Ex-Amazon',
    industry: ['Technology', 'Product'],
    lookingFor: ['Early stage founders'],
    pitch: '15+ years in product management. Happy to help with product strategy.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    role: 'Full Stack Developer',
    type: 'freelancer',
    industry: ['Web3', 'Blockchain'],
    lookingFor: ['Projects', 'Co-founder opportunities'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  },
];

export default function BusinessNetworkingScreen() {
  const [activeTab, setActiveTab] = useState<'founder' | 'investor' | 'mentor' | 'freelancer'>('founder');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProfiles = mockProfiles.filter(
    (p) => p.type === activeTab &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.industry.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      founder: COLORS.primary,
      investor: COLORS.success,
      mentor: COLORS.warning,
      freelancer: COLORS.accent,
    };
    return colors[type] || COLORS.primary;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      founder: 'rocket',
      investor: 'cash',
      mentor: 'school',
      freelancer: 'briefcase',
    };
    return icons[type] || 'people';
  };

  const renderProfile = ({ item }: { item: NetworkProfile }) => (
    <TouchableOpacity style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.avatarInitial}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{item.name}</Text>
          <Text style={styles.profileRole}>{item.role}</Text>
          {item.company && (
            <Text style={styles.profileCompany}>{item.company}</Text>
          )}
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Ionicons name={getTypeIcon(item.type) as any} size={12} color={getTypeColor(item.type)} />
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>

      {item.pitch && (
        <Text style={styles.profilePitch} numberOfLines={2}>
          {item.pitch}
        </Text>
      )}

      <View style={styles.profileDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="business" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.industry.join(', ')}</Text>
          </View>
        </View>
        {item.stage && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="trending-up" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{item.stage}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.lookingFor}>
        <Text style={styles.lookingForLabel}>Looking for:</Text>
        <View style={styles.tags}>
          {item.lookingFor.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.profileActions}>
        <TouchableOpacity style={styles.connectButton}>
          <Ionicons name="person-add" size={16} color="#fff" />
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Network</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or industry..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'founder', label: 'Founders', icon: 'rocket' },
          { key: 'investor', label: 'Investors', icon: 'cash' },
          { key: 'mentor', label: 'Mentors', icon: 'school' },
          { key: 'freelancer', label: 'Freelancers', icon: 'briefcase' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1.2K</Text>
          <Text style={styles.statLabel}>Founders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>340</Text>
          <Text style={styles.statLabel}>Investors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>89</Text>
          <Text style={styles.statLabel}>Mentors</Text>
        </View>
      </View>

      {/* Profiles List */}
      <FlatList
        data={filteredProfiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No profiles found</Text>
          </View>
        )}
      />
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileCompany: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  profilePitch: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  profileDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  lookingFor: {
    marginBottom: 12,
  },
  lookingForLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.text,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  connectText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 10,
    borderRadius: 10,
  },
  messageText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
});
