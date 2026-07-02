import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, Alert, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { societyApi, Visitor } from '../../src/services/societyService';

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

export default function VisitorManagementScreen() {
  const { id, societyName } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>([]);
  const [visitHistory, setVisitHistory] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    loadVisitors();
  }, [id]);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      const [pendingRes, historyRes] = await Promise.all([
        societyApi.getPendingVisitors(id as string),
        societyApi.getMyVisits(id as string),
      ]);
      setPendingVisitors(pendingRes.visitors || []);
      setVisitHistory(historyRes.visitors || []);
    } catch (error) {
      console.error('Failed to load visitors:', error);
      Alert.alert('Error', 'Failed to load visitors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (visitor: Visitor) => {
    Alert.alert(
      'Approve Visitor',
      `Approve ${visitor.visitorName} visiting Flat ${visitor.flatNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Generate QR',
          onPress: async () => {
            try {
              const result = await societyApi.generateQrPass(id as string, visitor.id);
              if (result.success) {
                setSelectedVisitor(result.visitor);
                loadVisitors();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to generate QR pass');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (visitor: Visitor) => {
    Alert.alert(
      'Reject Visitor',
      `Reject ${visitor.visitorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await societyApi.updateVisitorStatus(id as string, visitor.id, 'rejected');
              loadVisitors();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject visitor');
            }
          },
        },
      ]
    );
  };

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'delivery': return 'cube';
      case 'family': return 'people';
      case 'friend': return 'person';
      case 'service': return 'construct';
      default: return 'person-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.accentGold;
      case 'approved': return colors.accentGreen;
      case 'arrived': return colors.primary;
      case 'rejected': return colors.danger;
      case 'left': return colors.textMuted;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return `at ${time}`;
  };

  const visitors = activeTab === 'pending' ? pendingVisitors : visitHistory;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Visitor Management', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitor Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons name="time" size={18} color={activeTab === 'pending' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingVisitors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time-outline" size={18} color={activeTab === 'history' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History ({visitHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'pending' ? 'No Pending Visitors' : 'No Visitor History'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'pending'
              ? 'You will see visitor requests here when someone visits'
              : 'Approved and rejected visitors will appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVisitors(); }} />
          }
        >
          {visitors.map((visitor) => (
            <View key={visitor.id} style={styles.visitorCard}>
              <View style={styles.visitorRow}>
                <View style={styles.visitorIcon}>
                  <Ionicons name={getPurposeIcon(visitor.purpose)} size={24} color={colors.primary} />
                </View>
                <View style={styles.visitorInfo}>
                  <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                  <Text style={styles.visitorMeta}>
                    Flat {visitor.flatNumber} • {formatDate(visitor.expectedDate)} {formatTime(visitor.expectedTime)}
                  </Text>
                  {visitor.visitorPhone && (
                    <Text style={styles.visitorPhone}>{visitor.visitorPhone}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>
                    {visitor.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {activeTab === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(visitor)}
                  >
                    <Ionicons name="close" size={18} color={colors.danger} />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(visitor)}
                  >
                    <Ionicons name="checkmark" size={18} color={colors.accentGreen} />
                    <Text style={styles.approveText}>Approve & QR</Text>
                  </TouchableOpacity>
                </View>
              )}

              {visitor.status === 'approved' && visitor.qrCode && (
                <TouchableOpacity
                  style={styles.viewQrBtn}
                  onPress={() => {
                    setSelectedVisitor(visitor);
                    router.push(`/society/qr-pass?visitorId=${visitor.id}&societyId=${id}`);
                  }}
                >
                  <Ionicons name="qr-code" size={18} color={colors.primary} />
                  <Text style={styles.viewQrText}>View QR Pass</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* QR Modal */}
      {selectedVisitor && selectedVisitor.qrCode && (
        <QRPassModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </View>
  );
}

function QRPassModal({ visitor, onClose }: { visitor: Visitor; onClose: () => void }) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.modalClose} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>QR Pass Generated!</Text>
        <Text style={styles.modalSubtitle}>
          Share this with {visitor.visitorName}
        </Text>
        <Image
          source={{ uri: visitor.qrCode }}
          style={styles.qrImage}
          resizeMode="contain"
        />
        <Text style={styles.qrValidText}>
          Valid until {new Date(visitor.qrValidUntil!).toLocaleDateString('en-IN')}
        </Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.shareBtnText}>Share QR Pass</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginHorizontal: 4, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary + '20' },
  tabText: { marginLeft: 6, fontSize: 14, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  list: { flex: 1, paddingHorizontal: 16 },
  visitorCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  visitorRow: { flexDirection: 'row', alignItems: 'center' },
  visitorIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  visitorInfo: { flex: 1, marginLeft: 12 },
  visitorName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  visitorMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  visitorPhone: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.surfaceLight },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginHorizontal: 4 },
  rejectBtn: { backgroundColor: colors.danger + '15' },
  approveBtn: { backgroundColor: colors.accentGreen + '15' },
  rejectText: { marginLeft: 6, color: colors.danger, fontWeight: '600', fontSize: 14 },
  approveText: { marginLeft: 6, color: colors.accentGreen, fontWeight: '600', fontSize: 14 },
  viewQrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 8, backgroundColor: colors.primary + '15', borderRadius: 8 },
  viewQrText: { marginLeft: 6, color: colors.primary, fontWeight: '600' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340 },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  qrImage: { width: 240, height: 240, backgroundColor: '#fff', borderRadius: 12 },
  qrValidText: { fontSize: 12, color: colors.textMuted, marginTop: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 24 },
  shareBtnText: { marginLeft: 8, color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
});
