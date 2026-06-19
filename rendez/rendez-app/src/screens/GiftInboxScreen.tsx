import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftAPI, walletAPI } from '../services/api';
import { formatDateTime } from '../utils/dateFormatter';

type GiftStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REDEEMED' | 'EXPIRED';

interface Gift {
  id: string;
  senderId: string;
  giftType: 'COIN' | 'MERCHANT_VOUCHER';
  amountPaise: number;
  merchantName?: string;
  message?: string;
  status: GiftStatus;
  expiresAt: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<GiftStatus, { label: string; color: string }> = {
  PENDING:  { label: 'Waiting for you',  color: '#f59e0b' },
  ACCEPTED: { label: 'Accepted',         color: '#10b981' },
  REJECTED: { label: 'Declined',         color: '#ef4444' },
  REDEEMED: { label: 'Redeemed',         color: '#7c3aed' },
  EXPIRED:  { label: 'Expired',          color: '#9ca3af' },
};

export default function GiftInboxScreen({ navigation }: { navigation: { navigate: (s: string, p: object) => void } }) {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const queryClient = useQueryClient();

  const { data: gifts = [], isLoading, refetch } = useQuery<Gift[]>({
    queryKey: ['gifts', tab],
    queryFn: () =>
      tab === 'received'
        ? walletAPI.getReceivedGifts().then((r) => r.data as Gift[])
        : walletAPI.getSentGifts().then((r) => r.data as Gift[]),
    refetchInterval: 15000,
  });

  const acceptMutation = useMutation({
    mutationFn: (giftId: string) => giftAPI.accept(giftId),
    onSuccess: (_, giftId) => {
      Alert.alert('Gift accepted! 🎉', 'A message slot has been unlocked and the voucher is in your REZ wallet.');
      // RZ-M-F1 FIX: Invalidate the tab-specific key ['gifts', tab] — TanStack Query's
      // partial key matching does NOT match sub-keys with ['gifts']. Previously the inbox
      // would never refresh after accept/reject because ['gifts'] ≠ ['gifts', 'received'].
      queryClient.invalidateQueries({ queryKey: ['gifts', tab] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: () => Alert.alert('Error', 'Could not accept gift'),
  });

  const rejectMutation = useMutation({
    mutationFn: (giftId: string) => giftAPI.reject(giftId),
    onSuccess: () => {
      // RZ-M-F1 FIX: Also invalidate tab-specific key for reject.
      queryClient.invalidateQueries({ queryKey: ['gifts', tab] });
    },
    onError: () => Alert.alert('Error', 'Could not reject gift'),
  });

  const handleAccept = (gift: Gift) => {
    Alert.alert(
      'Accept gift?',
      gift.giftType === 'MERCHANT_VOUCHER'
        ? `You'll get a voucher for ${gift.merchantName} worth ₹${gift.amountPaise / 100}`
        : `You'll receive ₹${gift.amountPaise / 100} in REZ coins`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Accept', onPress: () => acceptMutation.mutate(gift.id) },
      ],
    );
  };

  const handleReject = (gift: Gift) => {
    Alert.alert('Decline gift?', 'The sender will get a full refund.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => rejectMutation.mutate(gift.id) },
    ]);
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'received' && styles.tabActive]}
          onPress={() => setTab('received')}
        >
          <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'sent' && styles.tabActive]}
          onPress={() => setTab('sent')}
        >
          <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>Sent</Text>
        </TouchableOpacity>
      </View>

      {gifts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyTitle}>No gifts {tab}</Text>
          <Text style={styles.emptySub}>
            {tab === 'received'
              ? 'When someone sends you a gift, it will appear here'
              : 'Gifts you send to matches appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(g) => g.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item: gift }) => {
            const statusCfg = STATUS_CONFIG[gift.status];
            const isPending = gift.status === 'PENDING';
            const isAccepted = gift.status === 'ACCEPTED';

            return (
              <View style={styles.giftCard}>
                <View style={styles.giftHeader}>
                  <Text style={styles.giftEmoji}>
                    {gift.giftType === 'COIN' ? '💰' : '🎁'}
                  </Text>
                  <View style={styles.giftMeta}>
                    <Text style={styles.giftAmount}>₹{gift.amountPaise / 100}</Text>
                    {gift.merchantName && (
                      <Text style={styles.giftMerchant}>{gift.merchantName}</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>

                {gift.message ? (
                  <Text style={styles.giftMessage}>"{gift.message}"</Text>
                ) : null}

                <Text style={styles.giftDate}>
                  {formatDateTime(gift.createdAt)}
                </Text>

                {isPending && tab === 'received' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(gift)}
                      disabled={rejectMutation.isPending}
                    >
                      <Text style={styles.rejectText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(gift)}
                      disabled={acceptMutation.isPending}
                    >
                      <Text style={styles.acceptText}>Accept Gift</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isAccepted && gift.giftType === 'MERCHANT_VOUCHER' && (
                  <TouchableOpacity
                    style={styles.voucherBtn}
                    onPress={() => navigation.navigate('Voucher', { giftId: gift.id })}
                  >
                    <Text style={styles.voucherBtnText}>View Voucher QR →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#7c3aed' },
  tabText: { fontSize: 15, color: '#bbb', fontWeight: '600' },
  tabTextActive: { color: '#7c3aed' },
  giftCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#f0e8ff',
    shadowColor: '#7c3aed', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  giftHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  giftEmoji: { fontSize: 32 },
  giftMeta: { flex: 1 },
  giftAmount: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  giftMerchant: { fontSize: 13, color: '#7c3aed', fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  giftMessage: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 8 },
  giftDate: { fontSize: 12, color: '#bbb', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#eee', alignItems: 'center',
  },
  rejectText: { color: '#888', fontWeight: '600' },
  acceptBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#7c3aed', alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700' },
  voucherBtn: {
    paddingVertical: 10, alignItems: 'center',
    borderTopWidth: 1, borderColor: '#f0e8ff', marginTop: 4,
  },
  voucherBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});
