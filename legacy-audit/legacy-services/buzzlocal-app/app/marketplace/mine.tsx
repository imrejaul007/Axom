/**
 * My Listings - Manage user's marketplace listings (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface Listing {
  id: string;
  title: string;
  price: string;
  image: string;
  views: number;
  messages: number;
  status: 'active' | 'sold' | 'pending';
  createdAt: Date;
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro - 256GB',
    price: '₹65,000',
    image: '',
    views: 234,
    messages: 12,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '2',
    title: 'MacBook Air M1 - Like New',
    price: '₹55,000',
    image: '',
    views: 189,
    messages: 8,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: '3',
    title: 'Sony WH-1000XM4 Headphones',
    price: '₹18,000',
    image: '',
    views: 156,
    messages: 5,
    status: 'sold',
    createdAt: new Date(Date.now() - 86400000 * 10),
  },
  {
    id: '4',
    title: 'Canon EOS R50 Camera',
    price: '₹45,000',
    image: '',
    views: 98,
    messages: 3,
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10B981', gradient: ['#10B981', '#059669'] as [string, string] },
  sold: { label: 'Sold', color: COLORS.textMuted, gradient: ['#6B7280', '#4B5563'] as [string, string] },
  pending: { label: 'Pending', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] as [string, string] },
};

export default function MyListingsScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredListings = listings.filter((listing) => {
    if (activeTab === 'all') return true;
    return listing.status === activeTab;
  });

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    sold: listings.filter((l) => l.status === 'sold').length,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleEdit = (listing: Listing) => {
    router.push(`/marketplace/create?edit=${listing.id}`);
  };

  const handleDelete = (listing: Listing) => {
    setListings((prev) => prev.filter((l) => l.id !== listing.id));
  };

  const handleMarkSold = (listing: Listing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: 'sold' } : l))
    );
  };

  const handleViewChat = (listing: Listing) => {
    router.push(`/marketplace/chat?listingId=${listing.id}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const TABS = ['all', 'active', 'sold', 'pending'] as const;

  const renderListing = ({ item }: { item: Listing }) => {
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <View style={styles.listingCard}>
        <TouchableOpacity
          style={styles.listingContent}
          onPress={() => router.push(`/marketplace/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.listingImage}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.imageGradient}>
              <Ionicons name="cube" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.listingPrice}>{item.price}</Text>
            <View style={styles.listingMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="eye" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{item.views}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="chatbubble" size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{item.messages}</Text>
              </View>
              <Text style={styles.listingDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.listingFooter}>
          <LinearGradient colors={statusConfig.gradient} style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </LinearGradient>

          <View style={styles.actions}>
            {item.messages > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewChat(item)}
              >
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="chatbubble" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            )}
            {item.status === 'active' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMarkSold(item)}
              >
                <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.surface }]}>
                <Ionicons name="create" size={16} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="trash" size={16} color={COLORS.error} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/marketplace/create')}
        >
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.addButtonGradient}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.1)', 'transparent']}
        style={styles.statsGradient}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.textMuted }]}>{stats.sold}</Text>
            <Text style={styles.statLabel}>Sold</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            {activeTab === tab ? (
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.tabGradient}>
                <Text style={styles.tabTextActive}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <Text style={styles.tabTextInactive}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        renderItem={renderListing}
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
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.emptyIcon}>
                <Ionicons name="cube-outline" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No Listings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? "You haven't listed unknown items yet"
                : `No ${activeTab} listings`}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/marketplace/create')}
            >
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.createButtonGradient}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Listing</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGradient: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  statNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  tabActive: {},
  tabGradient: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabInactive: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  tabTextActive: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#fff',
  },
  tabTextInactive: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  listingCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  listingContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  imageGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  listingDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginLeft: 'auto',
  },
  listingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIconContainer: {
    marginBottom: SPACING.lg,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  createButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  createButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});
