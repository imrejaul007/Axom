import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftAPI } from '../services/api';
import { COIN_AMOUNTS } from '@/constants';

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  amount_paise: number;
  merchant_name: string;
  merchant_logo_url?: string;
  category: string;
  tier: 'signal' | 'coffee' | 'treat' | 'experience' | 'exclusive';
}

const TIER_EMOJI: Record<string, string> = {
  signal: '💌', coffee: '☕', treat: '🍰', experience: '🍽️', exclusive: '✨',
};

export default function GiftPickerScreen({
  route, navigation,
}: {
  route: { params: { matchId: string; receiverId: string; receiverName: string } };
  navigation: { goBack: () => void };
}) {
  const { matchId, receiverId, receiverName } = route.params;
  const [tab, setTab] = useState<'merchant' | 'coins'>('merchant');
  const [message, setMessage] = useState('');
  const [selectedGift, setSelectedGift] = useState<CatalogItem | null>(null);
  const [selectedCoins, setSelectedCoins] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const queryClient = useQueryClient();

  const { data: catalog = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['gift-catalog'],
    queryFn: () => giftAPI.getCatalog().then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: object) => giftAPI.send(payload),
    onSuccess: () => {
      Alert.alert('Gift sent! 🎁', `Your gift to ${receiverName} is on its way.`);
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['gifts', tab] });
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
      navigation.goBack();
    },
    onError: (err: { response?: { data?: { error?: string; message?: string } } }) => {
      setConfirmVisible(false);
      Alert.alert('Error', err.response?.data?.message ?? err.response?.data?.error ?? 'Could not send gift');
    },
  });

  // RZ-M-F5: Do NOT dismiss modal here — let mutation onSuccess/onError handlers manage it.
  // Previously setConfirmVisible(false) fired before mutate() completed, causing the modal
  // to disappear while the backend was still processing. Now the modal stays visible until
  // the mutation resolves (success navigates away, error re-shows modal via onError).
  const handleSend = () => {
    if (tab === 'merchant' && selectedGift) {
      sendMutation.mutate({
        receiverId, matchId,
        giftType: 'MERCHANT_VOUCHER',
        amountPaise: selectedGift.amount_paise,
        rezCatalogItemId: selectedGift.id,
        message,
      });
    } else if (tab === 'coins' && selectedCoins) {
      sendMutation.mutate({
        receiverId, matchId,
        giftType: 'COIN',
        amountPaise: selectedCoins * 100,
        message,
      });
    }
  };

  const handleConfirm = async () => {
    const cost = tab === 'merchant' && selectedGift
      ? selectedGift.amount_paise
      : selectedCoins ? selectedCoins * 100 : 0;
    try {
      const { data: balanceData } = await queryClient.fetchQuery({
        queryKey: ['wallet-balance'],
        queryFn: () => import('../services/api').then(m => m.walletAPI.getBalance()),
      });
      const balance = balanceData?.balance_paise ?? balanceData?.coins ?? 0;
      if (balance < cost) {
        Alert.alert('Insufficient balance', 'You don\'t have enough balance to send this gift.');
        return;
      }
    } catch {
      // If we can't fetch balance, proceed and let the server reject if insufficient
    }
    setConfirmVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Send a gift to {receiverName}</Text>
      <Text style={styles.sub}>A gift unlocks one message slot</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'merchant' && styles.tabActive]}
          onPress={() => setTab('merchant')}
        >
          <Text style={[styles.tabText, tab === 'merchant' && styles.tabTextActive]}>Experiences</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'coins' && styles.tabActive]}
          onPress={() => setTab('coins')}
        >
          <Text style={[styles.tabText, tab === 'coins' && styles.tabTextActive]}>REZ Coins</Text>
        </TouchableOpacity>
      </View>

      {tab === 'merchant' ? (
        isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#7c3aed" />
        ) : (
          <FlatList
            data={catalog}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.giftCard, selectedGift?.id === item.id && styles.giftCardSelected]}
                onPress={() => setSelectedGift(selectedGift?.id === item.id ? null : item)}
              >
                <Text style={styles.giftEmoji}>{TIER_EMOJI[item.tier] || '🎁'}</Text>
                <View style={styles.giftInfo}>
                  <Text style={styles.giftName}>{item.name}</Text>
                  <Text style={styles.giftMerchant}>{item.merchant_name}</Text>
                  <Text style={styles.giftDesc} numberOfLines={2}>{item.description}</Text>
                </View>
                <View style={styles.giftRight}>
                  <Text style={styles.giftPrice}>₹{item.amount_paise / 100}</Text>
                  {selectedGift?.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        <View style={styles.coinsSection}>
          <Text style={styles.coinsLabel}>Choose amount to send</Text>
          <View style={styles.coinsGrid}>
            {COIN_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.coinChip, selectedCoins === amt && styles.coinChipSelected]}
                onPress={() => setSelectedCoins(selectedCoins === amt ? null : amt)}
              >
                <Text style={[styles.coinChipText, selectedCoins === amt && styles.coinChipTextSelected]}>
                  ₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.coinNote}>Coins are added to their REZ wallet instantly on accept</Text>
        </View>
      )}

      {/* Message input */}
      <View style={styles.messageSection}>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Add a personal note (optional)"
          maxLength={200}
          multiline
        />
      </View>

      {/* Send button */}
      <TouchableOpacity
        style={[
          styles.sendBtn,
          ((!selectedGift && !selectedCoins) || sendMutation.isPending) && styles.sendBtnDisabled,
        ]}
        onPress={handleConfirm}
        disabled={(!selectedGift && !selectedCoins) || sendMutation.isPending}
      >
        <Text style={styles.sendBtnText}>
          {sendMutation.isPending ? 'Sending...' : 'Send Gift 🎁'}
        </Text>
      </TouchableOpacity>

      {/* Confirm modal */}
      <Modal visible={confirmVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Gift</Text>
            <Text style={styles.modalBody}>
              {tab === 'merchant' && selectedGift
                ? `${selectedGift.name} at ${selectedGift.merchant_name} — ₹${selectedGift.amount_paise / 100}`
                : `₹${selectedCoins} in REZ coins`}
            </Text>
            {message ? <Text style={styles.modalNote}>"{message}"</Text> : null}
            <Text style={styles.modalSub}>
              This will be deducted from your REZ wallet. If {receiverName} accepts, a message slot unlocks.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setConfirmVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleSend}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginTop: 20 },
  sub: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#7c3aed' },
  giftCard: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#eee', borderRadius: 14, padding: 14, gap: 12,
  },
  giftCardSelected: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  giftEmoji: { fontSize: 32 },
  giftInfo: { flex: 1 },
  giftName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  giftMerchant: { fontSize: 12, color: '#7c3aed', marginTop: 2 },
  giftDesc: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 16 },
  giftRight: { alignItems: 'flex-end', gap: 4 },
  giftPrice: { fontSize: 17, fontWeight: '800', color: '#7c3aed' },
  checkmark: { fontSize: 18, color: '#7c3aed' },
  coinsSection: { padding: 24 },
  coinsLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 },
  coinsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  coinChip: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fff' },
  coinChipSelected: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  coinChipText: { fontSize: 18, fontWeight: '700', color: '#555' },
  coinChipTextSelected: { color: '#7c3aed' },
  coinNote: { fontSize: 12, color: '#999', marginTop: 16, lineHeight: 18 },
  messageSection: { paddingHorizontal: 16, paddingBottom: 8 },
  messageInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    padding: 12, fontSize: 14, minHeight: 60, maxHeight: 100,
  },
  sendBtn: {
    margin: 16, backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalBody: { fontSize: 16, color: '#333', fontWeight: '600' },
  modalNote: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 8 },
  modalSub: { fontSize: 13, color: '#999', marginTop: 12, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 12, alignItems: 'center' },
  modalConfirm: { flex: 1, padding: 14, backgroundColor: '#7c3aed', borderRadius: 12, alignItems: 'center' },
});
