/**
 * MyPlansScreen — tabbed view of organized plans + applied plans
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { planAPI } from '../services/api';
import { formatDateFull, formatDate } from '../utils/dateFormatter';

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#7c3aed', FILLED: '#059669', CANCELLED: '#ef4444',
  COMPLETED: '#2563eb', EXPIRED: '#d97706', NO_SHOW: '#6b7280',
};

const APP_STATUS_COLOR: Record<string, string> = {
  PENDING: '#d97706', SELECTED: '#059669', REJECTED: '#ef4444', WITHDRAWN: '#6b7280',
};

export default function MyPlansScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const [tab, setTab] = useState<'organized' | 'applied'>('organized');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['my-plans'],
    queryFn: () => planAPI.getMine().then((r) => r.data),
    retry: 2,
  });

  const organized = data?.organized || [];
  const applied   = data?.applied   || [];

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'organized' && styles.tabActive]} onPress={() => setTab('organized')}>
          <Text style={[styles.tabText, tab === 'organized' && styles.tabTextActive]}>
            My Plans ({organized.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'applied' && styles.tabActive]} onPress={() => setTab('applied')}>
          <Text style={[styles.tabText, tab === 'applied' && styles.tabTextActive]}>
            Applied ({applied.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#7c3aed" />
      ) : isError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>Couldn't load your plans</Text>
          <Text style={styles.errorSub}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'organized' ? (
        <FlatList
          data={organized}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7c3aed" />}
          renderItem={({ item }) => {
            const pendingCount = item.applications?.filter((a: { status: string }) => a.status === 'PENDING').length || 0;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.schedText}>
                  {formatDateFull(item.scheduledAt)}
                </Text>
                {item.status === 'OPEN' && pendingCount > 0 && (
                  <TouchableOpacity
                    style={styles.applicantsBtn}
                    onPress={() => navigation.navigate('Applicants', { planId: item.id })}
                  >
                    <Text style={styles.applicantsBtnText}>View {pendingCount} applicant{pendingCount !== 1 ? 's' : ''} →</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'FILLED' && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => navigation.navigate('PlanConfirm', { planId: item.id })}
                  >
                    <Text style={styles.confirmBtnText}>Confirm Attendance →</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<EmptyState icon="📅" title="No plans created" sub="Tap + Create Plan on the Plans tab" />}
        />
      ) : (
        <FlatList
          data={applied}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7c3aed" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('PlanDetail', { planId: item.plan.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.plan.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (APP_STATUS_COLOR[item.status] || '#888') + '20' }]}>
                  <Text style={[styles.statusText, { color: APP_STATUS_COLOR[item.status] || '#888' }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.schedText}>
                By {item.plan.organizer.name} · {formatDate(item.plan.scheduledAt, 'short')}
              </Text>
              {item.status === 'SELECTED' && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => navigation.navigate('PlanConfirm', { planId: item.plan.id })}
                >
                  <Text style={styles.confirmBtnText}>You were selected! Confirm →</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="🎯" title="No applications yet" sub="Browse the Plans tab to find something interesting" />}
        />
      )}
    </View>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fafafa' },
  tabRow:          { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0e6ff' },
  tab:             { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  tabText:         { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTextActive:   { color: '#7c3aed' },
  list:            { padding: 16, gap: 12 },
  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle:       { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  statusBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:      { fontSize: 11, fontWeight: '700' },
  schedText:       { fontSize: 12, color: '#888' },
  applicantsBtn:   { marginTop: 10, backgroundColor: '#faf5ff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  applicantsBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 13 },
  confirmBtn:      { marginTop: 10, backgroundColor: '#d1fae5', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmBtnText:  { color: '#059669', fontWeight: '700', fontSize: 13 },
  empty:           { alignItems: 'center', marginTop: 80 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  emptySub:        { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },
  errorState:      { alignItems: 'center', marginTop: 80, padding: 32 },
  errorEmoji:      { fontSize: 48, marginBottom: 12 },
  errorText:       { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  errorSub:        { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },
  retryBtn:        { marginTop: 16, backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});
