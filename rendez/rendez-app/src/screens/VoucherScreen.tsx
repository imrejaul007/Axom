import React from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Share, Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { giftAPI } from '../services/api';
import { formatDate } from '../utils/dateFormatter';

interface VoucherData {
  qr_code_url: string;
  merchant_name: string;
  valid_until: string;
  status: string;
}

export default function VoucherScreen({ route }: { route: { params: { giftId: string } } }) {
  const { giftId } = route.params;

  const { data: voucher, isLoading, error } = useQuery<VoucherData>({
    queryKey: ['voucher', giftId],
    queryFn: () => giftAPI.getVoucher(giftId).then((r) => r.data),
  });

  const handleShare = async () => {
    try {
      await Share.share({ message: `I have a voucher for ${voucher?.merchant_name}! Redeeming it on our date 💜` });
    } catch (err) {
      // R2-H1: Silent share failures cause attribution data loss and poor UX.
      // Alert the user so they can retry or use an alternative sharing method.
      Alert.alert('Share failed', 'Could not share voucher. Please try again.');
    }
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  if (error || !voucher) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>Could not load voucher</Text>
      </View>
    );
  }

  // R2-M4: Guard against null valid_until — new Date(null) creates Invalid Date
  // which is always "less than" a valid date, causing false expired status.
  const isExpired = voucher.status === 'EXPIRED' ||
    (voucher.valid_until ? new Date(voucher.valid_until) < new Date() : false);
  const isRedeemed = voucher.status === 'REDEEMED';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Merchant header */}
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantEmoji}>🎁</Text>
          <Text style={styles.merchantName}>{voucher.merchant_name}</Text>
        </View>

        {/* QR code area */}
        <View style={styles.qrContainer}>
          {isRedeemed ? (
            <View style={styles.redeemedOverlay}>
              <Text style={styles.redeemedStamp}>REDEEMED</Text>
            </View>
          ) : isExpired ? (
            <View style={styles.expiredOverlay}>
              <Text style={styles.expiredText}>Voucher Expired</Text>
            </View>
          ) : (
            <>
              {voucher.qr_code_url ? (
                <Image source={{ uri: voucher.qr_code_url }} style={styles.qrImage} resizeMode="contain" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderText}>QR Code</Text>
                  <Text style={styles.qrSub}>Show this at the merchant</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Validity */}
        <View style={styles.validityRow}>
          <Text style={styles.validityLabel}>Valid until</Text>
          <Text style={[styles.validityValue, isExpired && styles.expiredValue]}>
            {formatDate(voucher.valid_until, 'medium')}
          </Text>
        </View>

        {/* Instructions */}
        {!isRedeemed && !isExpired && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>How to redeem</Text>
            {[
              'Visit the merchant',
              'Show this QR code to the cashier',
              'Voucher will be scanned and marked as used',
            ].map((step, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Share */}
      {!isRedeemed && !isExpired && (
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share with match</Text>
        </TouchableOpacity>
      )}

      {/* REZ wallet note */}
      <Text style={styles.footnote}>
        This voucher is linked to your REZ account and can only be redeemed once
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ff', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#7c3aed', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  merchantHeader: { backgroundColor: '#7c3aed', padding: 20, alignItems: 'center', gap: 8 },
  merchantEmoji: { fontSize: 36 },
  merchantName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  qrContainer: { margin: 24, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  qrPlaceholder: { width: 180, height: 180, backgroundColor: '#f5f0ff', borderRadius: 12, borderWidth: 2, borderColor: '#e9d5ff', justifyContent: 'center', alignItems: 'center', gap: 8 },
  qrPlaceholderText: { fontSize: 18, fontWeight: '700', color: '#7c3aed' },
  qrSub: { fontSize: 12, color: '#999' },
  qrImage: { width: 200, height: 200, borderRadius: 8 },
  redeemedOverlay: { width: 180, height: 180, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10b981' },
  redeemedStamp: { fontSize: 22, fontWeight: '900', color: '#10b981', letterSpacing: 2 },
  expiredOverlay: { width: 180, height: 180, borderRadius: 12, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#eee' },
  expiredText: { fontSize: 18, fontWeight: '700', color: '#bbb' },
  validityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  validityLabel: { fontSize: 13, color: '#888' },
  validityValue: { fontSize: 13, fontWeight: '700', color: '#333' },
  expiredValue: { color: '#ef4444' },
  instructions: { borderTopWidth: 1, borderColor: '#f5f5f5', padding: 20, gap: 12 },
  instructionsTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  instructionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText: { fontSize: 14, color: '#444', flex: 1 },
  shareBtn: { marginTop: 16, borderWidth: 1.5, borderColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  shareBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 15 },
  footnote: { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 16, lineHeight: 18 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 16, color: '#888' },
});
