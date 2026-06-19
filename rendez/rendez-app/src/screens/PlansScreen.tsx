/**
 * PlansScreen — main plans feed
 * Filtered tab (personalised) + Explore tab (all city plans)
 */

import React, { useState, useCallback } from 'react';
import { formatDate, formatTime } from '../utils/dateFormatter';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { planAPI } from '../services/api';

const CATEGORY_EMOJI: Record<string, string> = {
  DINNER: '🍽️', LUNCH: '🥗', BREAKFAST: '☕', BRUNCH: '🥞',
  SPA: '💆', SALON: '💅', SHOPPING: '🛍️',
  BADMINTON: '🏸', SPORTS: '⚽', GAMING: '🎮',
};

interface Plan {
  id: string;
  title: string;
  category: string;
  merchantName: string;
  city: string;
  scheduledAt: string;
  expiresAt: string;
  applicantCount: number;
  viewsCount: number;
  vibe?: string;
  boostedUntil?: string;
  isSponsored?: boolean;
  sponsorPerAttendeeCoins?: number;
  organizer: {
    id: string; name: string; photos: string[]; isVerified: boolean; age: number;
    gender?: string; responseRate?: number; meetupCount?: number;
  };
}

function PlanCard({ plan, onPress }: { plan: Plan; onPress: () => void }) {
  const schedDate       = new Date(plan.scheduledAt);
  const now             = new Date();
  const hoursLeft       = Math.max(0, Math.floor((new Date(plan.expiresAt).getTime() - now.getTime()) / 3600000));
  const isBoosted       = plan.boostedUntil && new Date(plan.boostedUntil) > now;
  const isFemaleOrg    = plan.organizer.gender === 'FEMALE';
  const hasMeetups      = (plan.organizer.meetupCount ?? 0) > 0;
  const isResponsive    = (plan.organizer.responseRate ?? 1) >= 0.8;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Top badge row */}
      <View style={styles.topBadges}>
        {isBoosted && <View style={styles.boostBadge}><Text style={styles.boostText}>⚡ Featured</Text></View>}
        {plan.isSponsored && <View style={styles.sponsoredBadge}><Text style={styles.sponsoredText}>🏪 Sponsored — claim coins!</Text></View>}
        {isFemaleOrg && <View style={styles.womenBadge}><Text style={styles.womenText}>💜 Women's Plan</Text></View>}
      </View>

      <View style={styles.cardHeader}>
        {plan.organizer.photos[0] ? (
          <Image
            source={{ uri: plan.organizer.photos[0] }}
            style={[styles.avatar, isFemaleOrg && styles.avatarFemale]}
          />
        ) : (
          // RD-L-11 FIX: Replaced external ui-avatars.com fallback with a local initial view.
          // External avatar services can leak user data and are unnecessary for first-letter initials.
          <View style={[styles.avatar, styles.avatarInitial, isFemaleOrg && styles.avatarFemale]}>
            <Text style={styles.avatarInitialText}>{plan.organizer.name[0] ?? '?'}</Text>
          </View>
        )}
        <View style={styles.organizerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.organizerName}>{plan.organizer.name}, {plan.organizer.age}</Text>
            {plan.organizer.isVerified && <Text style={styles.verifiedBadge}>✓</Text>}
          </View>
          <Text style={styles.cityText}>{plan.city}</Text>
          {/* Organizer trust badges */}
          {(hasMeetups || isResponsive) && (
            <View style={styles.trustRow}>
              {hasMeetups && (
                <Text style={styles.trustChip}>✓ {plan.organizer.meetupCount} meetup{(plan.organizer.meetupCount ?? 0) > 1 ? 's' : ''}</Text>
              )}
              {isResponsive && (
                <Text style={[styles.trustChip, styles.trustChipGreen]}>⚡ Quick replies</Text>
              )}
            </View>
          )}
        </View>
        <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[plan.category] || '📅'}</Text>
      </View>

      <Text style={styles.planTitle}>{plan.title}</Text>

      <View style={styles.cardMeta}>
        <Text style={styles.metaItem}>
          📅 {formatDate(schedDate, 'short')}
          {'  '}
          🕐 {formatTime(schedDate)}
        </Text>
        {plan.vibe && <Text style={styles.vibeTag}>{plan.vibe}</Text>}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.applicantCount}>
          {plan.applicantCount > 0 ? `🔥 ${plan.applicantCount} applied` : 'Be the first to apply'}
        </Text>
        <Text style={[styles.expiryText, hoursLeft < 3 && styles.expiryUrgent]}>
          ⏳ {hoursLeft}h left
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PlansScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const [explore, setExplore] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['plans-feed', explore],
    // RD-M-18 FIX: Unwrap { plans, nextCursor } from the paginated response.
    queryFn: () => planAPI.getFeed({ explore }).then((r) => r.data),
    retry: 2,
  });

  const handlePress = useCallback((plan: Plan) => {
    navigation.navigate('PlanDetail', { planId: plan.id });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, !explore && styles.tabActive]}
          onPress={() => setExplore(false)}
        >
          <Text style={[styles.tabText, !explore && styles.tabTextActive]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, explore && styles.tabActive]}
          onPress={() => setExplore(true)}
        >
          <Text style={[styles.tabText, explore && styles.tabTextActive]}>Explore All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#7c3aed" />
      ) : isError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>Couldn't load plans</Text>
          <Text style={styles.errorSub}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.plans || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlanCard plan={item} onPress={() => handlePress(item)} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7c3aed" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No plans yet</Text>
              <Text style={styles.emptySub}>Be the first to create one</Text>
            </View>
          }
        />
      )}

      {/* FAB — create plan */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePlan')}>
        <Text style={styles.fabText}>+ Create Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fafafa' },
  tabRow:         { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0e6ff' },
  tab:            { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  tabText:        { fontSize: 14, fontWeight: '600', color: '#999' },
  tabTextActive:  { color: '#7c3aed' },
  list:           { padding: 16, gap: 12, paddingBottom: 100 },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#7c3aed', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  topBadges:      { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  boostBadge:     { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  boostText:      { fontSize: 11, fontWeight: '700', color: '#d97706' },
  sponsoredBadge: { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sponsoredText:  { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  womenBadge:     { backgroundColor: '#fdf4ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  womenText:      { fontSize: 11, fontWeight: '700', color: '#a21caf' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0e6ff' },
  avatarInitial:  { backgroundColor: '#f0e6ff', justifyContent: 'center', alignItems: 'center' },
  avatarInitialText:{ fontSize: 18, fontWeight: '700', color: '#7c3aed' },
  avatarFemale:   { borderWidth: 2, borderColor: '#d946ef' },
  organizerInfo:  { flex: 1, marginLeft: 10 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  organizerName:  { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  verifiedBadge:  { fontSize: 12, color: '#7c3aed', fontWeight: '800' },
  cityText:       { fontSize: 12, color: '#888', marginTop: 1 },
  trustRow:       { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  trustChip:      { fontSize: 10, color: '#7c3aed', fontWeight: '700', backgroundColor: '#f5f3ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  trustChipGreen: { color: '#059669', backgroundColor: '#f0fdf4' },
  categoryEmoji:  { fontSize: 28 },
  planTitle:      { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metaItem:       { fontSize: 12, color: '#555' },
  vibeTag:        { fontSize: 11, color: '#7c3aed', fontWeight: '600', backgroundColor: '#faf5ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applicantCount: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  expiryText:     { fontSize: 11, color: '#888' },
  expiryUrgent:   { color: '#ef4444', fontWeight: '700' },
  empty:          { alignItems: 'center', marginTop: 80 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  emptySub:       { fontSize: 14, color: '#888', marginTop: 4 },
  fab:            { position: 'absolute', bottom: 24, right: 20, backgroundColor: '#7c3aed', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  fabText:        { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorState:     { alignItems: 'center', marginTop: 80, padding: 32 },
  errorEmoji:     { fontSize: 48, marginBottom: 12 },
  errorText:      { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  errorSub:       { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },
  retryBtn:       { marginTop: 16, backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});
