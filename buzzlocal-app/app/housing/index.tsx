import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, FlatList, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API = 'http://localhost:4020';

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

const TABS = ['Rentals', 'PGs', 'Flatmates'];

export default function HousingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = activeTab === 2
        ? {}
        : { type: activeTab === 0 ? 'rental' : 'pg', area: search || undefined };

      const [listRes, areasRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/housing/properties`, { params }).catch(() => ({ data: { properties: [] } })),
        axios.get(`${API}/api/housing/areas`).catch(() => ({ data: { areas: [] } })),
        axios.get(`${API}/api/housing/stats`).catch(() => ({ data: { stats: {} } })),
      ]);

      setListings(listRes.data.properties || []);
      setAreas(areasRes.data.areas || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Failed to load housing data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPurposeIcon = (type: string) => {
    switch (type) {
      case 'rental': return 'home';
      case 'pg': return 'bed';
      case 'coliving': return 'people';
      default: return 'home';
    }
  };

  const formatRent = (rent: number) => {
    return `Rs ${rent.toLocaleString('en-IN')}`;
  };

  const renderListing = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => router.push(`/housing/${item._id}`)}
    >
      <View style={styles.listingImage}>
        <Ionicons name={getPurposeIcon(item.type)} size={40} color={colors.primary} />
      </View>
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.listingArea}>{item.address?.area}, {item.address?.city}</Text>
        <View style={styles.listingMeta}>
          <Text style={styles.listingRent}>{formatRent(item.monthlyRent)}/mo</Text>
          <Text style={styles.listingBeds}>{item.bedrooms} BHK</Text>
        </View>
        <View style={styles.listingTags}>
          {item.furnished && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.furnished}</Text>
            </View>
          )}
          {item.foodIncluded && (
            <View style={[styles.tag, styles.tagGreen]}>
              <Text style={[styles.tagText, styles.tagTextGreen]}>Food incl.</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Habixo', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habixo</Text>
        <Text style={styles.headerSubtitle}>Find your next home</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/housing/add-listing')}>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search area, locality..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadData}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); loadData(); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatRent(stats.avgRent || 0)}</Text>
            <Text style={styles.statLabel}>Avg Rent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pgs || 0}</Text>
            <Text style={styles.statLabel}>PGs</Text>
          </View>
        </View>
      )}

      {/* Popular Areas */}
      {areas.length > 0 && (
        <View style={styles.areasSection}>
          <Text style={styles.sectionTitle}>Popular Areas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {areas.slice(0, 5).map((area: any) => (
              <TouchableOpacity
                key={area._id}
                style={styles.areaChip}
                onPress={() => { setSearch(area._id); loadData(); }}
              >
                <Text style={styles.areaChipText}>{area._id}</Text>
                <Text style={styles.areaChipCount}>{area.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Listings */}
      <FlatList
        data={listings}
        renderItem={renderListing}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 2
                  ? 'Be the first to find a flatmate'
                  : 'List your property to help others find homes'}
              </Text>
              <TouchableOpacity
                style={styles.listPropertyBtn}
                onPress={() => router.push('/housing/add-listing')}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
                <Text style={styles.listPropertyBtnText}>List Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: colors.surface },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', marginTop: 12 },
  headerBtn: { backgroundColor: colors.primary, padding: 10, borderRadius: 12, marginRight: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, marginVertical: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.textPrimary },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.surfaceLight },
  areasSection: { marginTop: 16, paddingLeft: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  areaChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  areaChipText: { fontSize: 13, color: colors.textPrimary },
  areaChipCount: { fontSize: 11, color: colors.primary, marginLeft: 6, fontWeight: '600' },
  list: { padding: 16 },
  listingCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  listingImage: { width: 100, height: 100, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  listingInfo: { flex: 1, padding: 12 },
  listingTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  listingArea: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  listingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  listingRent: { fontSize: 16, fontWeight: '700', color: colors.accentGreen },
  listingBeds: { fontSize: 12, color: colors.textSecondary, marginLeft: 12 },
  listingTags: { flexDirection: 'row', marginTop: 6 },
  tag: { backgroundColor: colors.surfaceLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 4 },
  tagGreen: { backgroundColor: colors.accentGreen + '20' },
  tagText: { fontSize: 10, color: colors.textMuted },
  tagTextGreen: { color: colors.accentGreen },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
  listPropertyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 24 },
  listPropertyBtnText: { marginLeft: 8, color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
});
