import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { societyApi, Visitor, QrPass } from '../../src/services/societyService';

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

export default function QRPassScreen() {
  const { visitorId, societyId } = useLocalSearchParams();
  const router = useRouter();
  const [qrPass, setQrPass] = useState<QrPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQrPass();
  }, [visitorId]);

  const loadQrPass = async () => {
    try {
      setLoading(true);
      const result = await societyApi.getQrPass(societyId as string, visitorId as string);
      if (result.success && result.qrPass) {
        setQrPass(result.qrPass);
      }
    } catch (err) {
      setError('QR pass not available');
    } finally {
      setLoading(false);
    }
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'family': return 'Family Visit';
      case 'friend': return 'Friend Visit';
      case 'delivery': return 'Delivery';
      case 'service': return 'Service Call';
      default: return 'Guest Visit';
    }
  };

  const isExpired = qrPass ? new Date(qrPass.validUntil) < new Date() : false;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'QR Pass', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitor Pass</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading QR Pass...</Text>
        </View>
      ) : error || !qrPass ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>QR Pass Not Available</Text>
          <Text style={styles.errorSubtitle}>{error || 'The QR pass has not been generated yet'}</Text>
        </View>
      ) : isExpired ? (
        <View style={styles.errorContainer}>
          <Ionicons name="time" size={64} color={colors.accentGold} />
          <Text style={styles.errorTitle}>Pass Expired</Text>
          <Text style={styles.errorSubtitle}>This QR pass is no longer valid</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Visitor Info */}
          <View style={styles.visitorCard}>
            <View style={styles.visitorHeader}>
              <View style={styles.visitorAvatar}>
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <View style={styles.visitorInfo}>
                <Text style={styles.visitorName}>{qrPass.visitorName}</Text>
                <Text style={styles.visitorFlat}>Flat {qrPass.flatNumber}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>APPROVED</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.purposeRow}>
              <Ionicons
                name={qrPass.purpose === 'delivery' ? 'cube' : qrPass.purpose === 'service' ? 'construct' : 'people'}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.purposeText}>{getPurposeLabel(qrPass.purpose)}</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <View style={styles.qrCard}>
              <Image
                source={{ uri: qrPass.qrCode }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrLabel}>Scan at Gate</Text>
            <Text style={styles.qrSublabel}>Show this QR code to the security guard</Text>
          </View>

          {/* Validity */}
          <View style={styles.validityCard}>
            <View style={styles.validityRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.accentGreen} />
              <View style={styles.validityInfo}>
                <Text style={styles.validityLabel}>Valid Until</Text>
                <Text style={styles.validityValue}>
                  {new Date(qrPass.validUntil).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            <View style={styles.instructionRow}>
              <View style={styles.instructionNum}>
                <Text style={styles.instructionNumText}>1</Text>
              </View>
              <Text style={styles.instructionText}>Show this QR code at the society entrance</Text>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.instructionNum}>
                <Text style={styles.instructionNumText}>2</Text>
              </View>
              <Text style={styles.instructionText}>Security guard will scan and verify</Text>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.instructionNum}>
                <Text style={styles.instructionNumText}>3</Text>
              </View>
              <Text style={styles.instructionText}>Entry is granted after verification</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: colors.surface,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginTop: 16 },
  errorSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  content: { flex: 1, paddingHorizontal: 16 },
  visitorCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 16 },
  visitorHeader: { flexDirection: 'row', alignItems: 'center' },
  visitorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  visitorInfo: { flex: 1, marginLeft: 12 },
  visitorName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  visitorFlat: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { backgroundColor: colors.accentGreen + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.accentGreen },
  divider: { height: 1, backgroundColor: colors.surfaceLight, marginVertical: 12 },
  purposeRow: { flexDirection: 'row', alignItems: 'center' },
  purposeText: { marginLeft: 8, fontSize: 14, color: colors.textSecondary },
  qrContainer: { alignItems: 'center', marginTop: 24 },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  qrImage: { width: 220, height: 220 },
  qrLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
  qrSublabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  validityCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 20 },
  validityRow: { flexDirection: 'row', alignItems: 'center' },
  validityInfo: { marginLeft: 12 },
  validityLabel: { fontSize: 12, color: colors.textMuted },
  validityValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
  instructionsCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 12, marginBottom: 24 },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  instructionNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  instructionNumText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  instructionText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
