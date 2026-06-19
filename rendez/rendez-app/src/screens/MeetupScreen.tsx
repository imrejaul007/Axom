import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, ScrollView, Platform, Modal,
} from 'react-native';
// expo-camera is not available on web — import only on native
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CameraView, useCameraPermissions } = Platform.OS !== 'web'
  ? require('expo-camera')
  : { CameraView: () => null, useCameraPermissions: () => [{ granted: false }, async () => ({ granted: false })] };
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetupAPI } from '../services/api';

// RD-M-05 FIX: Custom booking ID modal replacing Alert.prompt (iOS-only API).
// Alert.prompt was removed in React Native 0.72+ and iOS 16+.
// This modal works consistently across iOS, Android, and web.
function BookingIdModal({
  visible, matchName,
  onSubmit, onClose,
}: {
  visible: boolean; matchName: string;
  onSubmit: (id: string) => void; onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={bmo.overlay}>
        <View style={bmo.box}>
          <Text style={bmo.title}>Enter Booking ID</Text>
          <Text style={bmo.sub}>
            Ask the merchant staff for your booking reference number and enter it below.
          </Text>
          <TextInput
            style={bmo.input}
            value={value}
            onChangeText={setValue}
            placeholder="Booking reference"
            placeholderTextColor="#bbb"
            autoFocus
            autoCapitalize="characters"
          />
          <View style={bmo.actions}>
            <TouchableOpacity style={bmo.cancelBtn} onPress={onClose}>
              <Text style={bmo.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[bmo.submitBtn, !value.trim() && bmo.submitDisabled]}
              onPress={handleSubmit}
              disabled={!value.trim()}
            >
              <Text style={bmo.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const bmo = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box:    { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  title:  { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  sub:    { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 16 },
  input:  { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: '#333' },
  actions:{ flexDirection: 'row', gap: 10 },
  cancelBtn:{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#eee', alignItems: 'center' },
  cancelText:{ color: '#888', fontWeight: '600', fontSize: 15 },
  submitBtn:{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  submitDisabled:{ opacity: 0.4 },
  submitText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});

interface Merchant {
  merchant_id: string;
  name: string;
  category: string;
  address: string;
  distance_km: number;
  rating: number;
  rendez_verified?: boolean;
}

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕', restaurant: '🍽️', dessert: '🍰',
  bar: '🍸', lounge: '🎵', bakery: '🥐', default: '📍',
};

type Step = 'suggest' | 'book' | 'checkin' | 'waiting' | 'done';

interface RouteParams {
  matchId: string;
  matchName: string;
}

export default function MeetupScreen({ route, navigation }: { route: { params: RouteParams }; navigation: { goBack: () => void } }) {
  const { matchId, matchName } = route.params;
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('suggest');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  // RD-M-05 FIX: State for the custom booking ID modal (replaces Alert.prompt).
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Merchant suggestions
  // RD-M-06 FIX: Added isError state and refetch so merchant load failures show a retry UI.
  const { data: merchants = [], isLoading: merchantsLoading, isError: merchantsError, refetch: refetchMerchants } = useQuery<Merchant[]>({
    queryKey: ['meetup-suggest', matchId],
    queryFn: () => meetupAPI.suggest(matchId).then((r) => r.data),
    enabled: step === 'suggest',
    staleTime: 5 * 60 * 1000,
  });

  // Poll meetup status while in checkin/waiting step
  const { data: meetupStatus } = useQuery({
    queryKey: ['meetup-status', matchId],
    queryFn: () => meetupAPI.getStatus(matchId).then((r) => r.data),
    refetchInterval: (step === 'checkin' || step === 'waiting') ? 4000 : false,
    enabled: step === 'checkin' || step === 'waiting' || step === 'done',
  });

  // Auto-advance to done when partner checks in
  useEffect(() => {
    if (meetupStatus?.bothCheckedIn && step === 'waiting') {
      setStep('done');
    }
  }, [meetupStatus?.bothCheckedIn]);

  const bookMutation = useMutation({
    mutationFn: () => {
      // R2-M2: Guard against null selectedMerchant — non-null assertion could crash
      if (!selectedMerchant) {
        return Promise.reject(new Error('No merchant selected'));
      }
      return meetupAPI.book({ matchId, merchantId: selectedMerchant.merchant_id, date: bookingDate, partySize: 2 });
    },
    onSuccess: (res) => {
      setBookingId(res.data.booking_id);
      setStep('checkin');
      queryClient.invalidateQueries({ queryKey: ['meetup-status', matchId] });
    },
    onError: () => Alert.alert('Booking failed', 'Could not book. Try a different date or merchant.'),
  });

  const checkinMutation = useMutation({
    mutationFn: (scannedBookingId?: string) => {
      // R2-M2: Guard against null selectedMerchant
      if (!selectedMerchant) {
        return Promise.reject(new Error('No merchant selected'));
      }
      return meetupAPI.checkin(matchId, {
        bookingId: scannedBookingId || bookingId,
        merchantId: selectedMerchant.merchant_id,
      });
    },
    onSuccess: (res) => {
      setScanning(false);
      if (res.data.bothCheckedIn) {
        setStep('done');
      } else if (res.data.alreadyCheckedIn) {
        setStep('waiting');
      } else {
        setStep('waiting');
      }
      queryClient.invalidateQueries({ queryKey: ['meetup-status', matchId] });
    },
    onError: () => {
      setScanning(false);
      Alert.alert('Check-in failed', 'QR code not valid for this booking.');
    },
  });

  const handleQrScanned = ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    // QR payload: JSON { bookingId, merchantId }
    try {
      const parsed = JSON.parse(data);
      if (parsed.bookingId) {
        checkinMutation.mutate(parsed.bookingId);
        return;
      }
    } catch { /* not JSON — use raw string */ }
    checkinMutation.mutate(data);
  };

  const startQrScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera needed', 'Allow camera access to scan the merchant QR code');
        return;
      }
    }
    setScanning(true);
  };

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (step === 'done' || meetupStatus?.reward?.status === 'TRIGGERED') {
    return (
      <View style={styles.celebrationContainer}>
        <Text style={styles.celebrationEmoji}>🎊</Text>
        <Text style={styles.celebrationTitle}>Meetup Complete!</Text>
        <Text style={styles.celebrationSub}>
          REZ reward coins have been sent to both wallets.{'\n'}
          Hope you had a great time!
        </Text>
        <View style={styles.rewardCard}>
          <Text style={styles.rewardCardLabel}>Reward Status</Text>
          <Text style={styles.rewardCardValue}>
            {meetupStatus?.reward?.status === 'TRIGGERED' ? '✓ Coins delivered' : '⏳ Processing...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Back to Chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Waiting for partner checkin ───────────────────────────────────────────
  if (step === 'waiting') {
    return (
      <View style={styles.container}>
        <View style={styles.waitCard}>
          <Text style={styles.waitEmoji}>⏳</Text>
          <Text style={styles.waitTitle}>You're checked in!</Text>
          <Text style={styles.waitSub}>
            Waiting for {matchName} to scan their QR at {selectedMerchant?.name}.{'\n'}
            Both must check in within 30 minutes.
          </Text>
          <View style={styles.checkinRow}>
            <View style={styles.checkinPerson}>
              <View style={[styles.checkinDot, styles.checkinDotDone]} />
              <Text style={styles.checkinName}>You</Text>
            </View>
            <View style={styles.checkinLine} />
            <View style={styles.checkinPerson}>
              <View style={[styles.checkinDot, meetupStatus?.partnerCheckedIn && styles.checkinDotDone]} />
              <Text style={styles.checkinName}>{matchName}</Text>
            </View>
          </View>
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 20 }} />
          <Text style={styles.pollingText}>Checking every 4s...</Text>
        </View>
      </View>
    );
  }

  // ── QR Scanner overlay ────────────────────────────────────────────────────
  if (scanning) {
    if (Platform.OS === 'web') {
      // Camera QR scanning not available on web — prompt manual entry
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }]}>
          <Text style={{ fontSize: 48 }}>📱</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', textAlign: 'center' }}>
            QR scanning requires the mobile app
          </Text>
          <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 }}>
            Download Rendez on iOS or Android to scan the merchant QR code, or enter your booking ID manually below.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {
            setScanning(false);
            Alert.alert('Enter Booking ID', 'Ask the merchant for your booking reference and enter it manually.');
          }}>
            <Text style={styles.primaryBtnText}>Enter Code Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScanning(false)}>
            <Text style={{ color: '#888', marginTop: 8 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleQrScanned}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>Scan the merchant QR code at the counter</Text>
          <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setScanning(false)}>
            <Text style={styles.cancelScanText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Checkin step ──────────────────────────────────────────────────────────
  if (step === 'checkin') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={styles.merchantHeader}>
            <Text style={styles.merchantHeaderEmoji}>
              {CATEGORY_EMOJI[selectedMerchant?.category || 'default']}
            </Text>
            <View>
              <Text style={styles.merchantHeaderName}>{selectedMerchant?.name}</Text>
              <Text style={styles.merchantHeaderAddr}>{selectedMerchant?.address}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to check in</Text>
            {[
              'Go to the counter at the merchant',
              'Ask staff to show you the Rendez QR code',
              'Both of you scan within 30 minutes',
              'Reward coins land in your REZ wallet automatically',
            ].map((step, i) => (
              <View key={i} style={styles.infoStep}>
                <View style={styles.infoStepNum}>
                  <Text style={styles.infoStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.infoStepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, checkinMutation.isPending && styles.btnDisabled]}
            onPress={startQrScan}
            disabled={checkinMutation.isPending}
          >
            {checkinMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>📷  Scan QR Code</Text>}
          </TouchableOpacity>

          <Text style={styles.orDivider}>— or —</Text>

          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowBookingModal(true)}
          >
            <Text style={styles.manualBtnText}>Enter code manually</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Book step ─────────────────────────────────────────────────────────────
  if (step === 'book' && selectedMerchant) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={styles.merchantHeader}>
            <Text style={styles.merchantHeaderEmoji}>
              {CATEGORY_EMOJI[selectedMerchant.category || 'default']}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantHeaderName}>{selectedMerchant.name}</Text>
              <Text style={styles.merchantHeaderAddr}>{selectedMerchant.address}</Text>
              {selectedMerchant.rating > 0 && (
                <Text style={styles.merchantRating}>★ {selectedMerchant.rating.toFixed(1)}</Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date & Time</Text>
            <TextInput
              style={styles.textInput}
              value={bookingDate}
              onChangeText={setBookingDate}
              placeholder="e.g. 2026-04-20 19:00"
              placeholderTextColor="#bbb"
            />
            <Text style={styles.fieldHint}>Format: YYYY-MM-DD HH:MM</Text>
          </View>

          <View style={styles.bookSummary}>
            <Text style={styles.bookSummaryTitle}>Booking for 2 people</Text>
            <Text style={styles.bookSummaryNote}>
              After booking, you'll both need to check in at the merchant using the QR code to validate your meetup and receive REZ rewards.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!bookingDate.trim() || bookMutation.isPending) && styles.btnDisabled]}
            onPress={() => bookMutation.mutate()}
            disabled={!bookingDate.trim() || bookMutation.isPending}
          >
            {bookMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Confirm Booking</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('suggest')}>
            <Text style={styles.backBtnText}>← Choose different venue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Suggest step (default) ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.suggestHeader}>
        <Text style={styles.suggestTitle}>Plan a date with {matchName}</Text>
        <Text style={styles.suggestSub}>REZ-verified venues near you</Text>
      </View>

      {merchantsLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#7c3aed" size="large" />
      ) : merchantsError ? (
        // RD-M-06 FIX: Show error state with retry button when merchant fetch fails.
        <View style={styles.emptyMerchants}>
          <Text style={styles.emptyMerchantsText}>Couldn't load venues</Text>
          <Text style={styles.emptyMerchantsSub}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetchMerchants()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : merchants.length === 0 ? (
        <View style={styles.emptyMerchants}>
          <Text style={styles.emptyMerchantsText}>No REZ merchants near you yet</Text>
          <Text style={styles.emptyMerchantsSub}>Update your location in Profile settings</Text>
        </View>
      ) : (
        <FlatList
          data={merchants}
          keyExtractor={(m) => m.merchant_id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.merchantCard}
              onPress={() => { setSelectedMerchant(item); setStep('book'); }}
            >
              <View style={styles.merchantCardLeft}>
                <Text style={styles.merchantEmoji}>
                  {CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.default}
                </Text>
                <View>
                  <View style={styles.merchantNameRow}>
                    <Text style={styles.merchantName}>{item.name}</Text>
                    {item.rendez_verified && (
                      <Text style={styles.verifiedTag}>✓ Rendez</Text>
                    )}
                  </View>
                  <Text style={styles.merchantAddr} numberOfLines={1}>{item.address}</Text>
                  <View style={styles.merchantMeta}>
                    <Text style={styles.merchantDist}>📍 {item.distance_km.toFixed(1)} km</Text>
                    {item.rating > 0 && (
                      <Text style={styles.merchantRatingSmall}>★ {item.rating.toFixed(1)}</Text>
                    )}
                  </View>
                </View>
              </View>
              <Text style={styles.merchantChevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* RD-M-05 FIX: Custom booking ID modal — replaces Alert.prompt which is iOS-only. */}
      <BookingIdModal
        visible={showBookingModal}
        matchName={matchName}
        onSubmit={(id) => { setShowBookingModal(false); checkinMutation.mutate(id); }}
        onClose={() => setShowBookingModal(false)}
      />
    </View>
  );
}
  container: { flex: 1, backgroundColor: '#faf5ff' },

  suggestHeader: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0e6ff' },
  suggestTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  suggestSub: { fontSize: 13, color: '#888', marginTop: 4 },

  merchantCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#7c3aed', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  merchantCardLeft: { flexDirection: 'row', gap: 14, flex: 1 },
  merchantEmoji: { fontSize: 32, width: 40 },
  merchantNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  merchantName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  verifiedTag: { fontSize: 10, color: '#7c3aed', backgroundColor: '#f3e8ff', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, fontWeight: '700' },
  merchantAddr: { fontSize: 12, color: '#888', marginTop: 2, maxWidth: 200 },
  merchantMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  merchantDist: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  merchantRatingSmall: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  merchantChevron: { fontSize: 22, color: '#ddd', fontWeight: '300' },

  merchantHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  merchantHeaderEmoji: { fontSize: 36 },
  merchantHeaderName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  merchantHeaderAddr: { fontSize: 13, color: '#888', marginTop: 2 },
  merchantRating: { fontSize: 13, color: '#f59e0b', fontWeight: '600', marginTop: 4 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldHint: { fontSize: 11, color: '#bbb' },
  textInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: '#fff', color: '#333',
  },

  bookSummary: { backgroundColor: '#f3e8ff', borderRadius: 12, padding: 16, gap: 6 },
  bookSummaryTitle: { fontSize: 14, fontWeight: '700', color: '#7c3aed' },
  bookSummaryNote: { fontSize: 13, color: '#555', lineHeight: 20 },

  primaryBtn: {
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { alignItems: 'center', paddingVertical: 10 },
  backBtnText: { color: '#888', fontSize: 14 },

  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  infoStep: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoStepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoStepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoStepText: { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },

  orDivider: { textAlign: 'center', color: '#bbb', fontSize: 13 },
  manualBtn: { alignItems: 'center', paddingVertical: 10 },
  manualBtnText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },

  scannerContainer: { flex: 1 },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 240, height: 240, borderWidth: 3, borderColor: '#7c3aed',
    borderRadius: 16, backgroundColor: 'transparent',
    shadowColor: '#7c3aed', shadowOpacity: 0.8, shadowRadius: 12,
  },
  scannerHint: { color: '#fff', marginTop: 24, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  cancelScanBtn: { marginTop: 32, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  cancelScanText: { color: '#fff', fontWeight: '600' },

  waitCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  waitEmoji: { fontSize: 56 },
  waitTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  waitSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  checkinRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 0 },
  checkinPerson: { alignItems: 'center', gap: 6, width: 80 },
  checkinDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e9d5ff', borderWidth: 2, borderColor: '#c4b5fd' },
  checkinDotDone: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkinLine: { flex: 1, height: 2, backgroundColor: '#e9d5ff' },
  checkinName: { fontSize: 12, color: '#888', fontWeight: '600' },
  pollingText: { color: '#ccc', fontSize: 11, marginTop: 8 },

  celebrationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#faf5ff', gap: 16 },
  celebrationEmoji: { fontSize: 72 },
  celebrationTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  celebrationSub: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24 },
  rewardCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', shadowColor: '#7c3aed', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, marginTop: 8 },
  rewardCardLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  rewardCardValue: { fontSize: 18, fontWeight: '700', color: '#7c3aed', marginTop: 6 },
  doneBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  emptyMerchants: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyMerchantsText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptyMerchantsSub: { fontSize: 13, color: '#999' },
  retryBtn: { marginTop: 8, backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
