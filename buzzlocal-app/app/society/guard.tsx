import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert, Vibration } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { societyApi } from '../../src/services/societyService';

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

interface VerifyResult {
  verified: boolean;
  visitor?: {
    name: string;
    phone: string;
    purpose: string;
    flatNumber: string;
    hostName: string;
    expectedTime?: string;
    checkInTime?: string;
  };
  society?: { name: string; address: any };
  message?: string;
  error?: string;
  usedAt?: string;
}

export default function GuardModeScreen() {
  const { societyId } = useLocalSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async (qrToken: string) => {
    if (!qrToken.trim()) return;

    try {
      setVerifying(true);
      setResult(null);
      const response = await societyApi.verifyQrPass(societyId as string, qrToken.trim());
      setResult(response);

      if (response.verified) {
        Vibration.vibrate(200);
      } else {
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify QR code');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = () => {
    if (token.trim()) {
      handleVerify(token.trim());
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setToken('');
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Guard Mode', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Guard Mode</Text>
          <View style={styles.guardBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.accentGreen} />
            <Text style={styles.guardBadgeText}>SECURITY</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'scan' && styles.modeBtnActive]}
          onPress={() => { setMode('scan'); setResult(null); }}
        >
          <Ionicons name="qr-code-outline" size={20} color={mode === 'scan' ? colors.primary : colors.textMuted} />
          <Text style={[styles.modeBtnText, mode === 'scan' && styles.modeBtnTextActive]}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
          onPress={() => { setMode('manual'); setResult(null); }}
        >
          <Ionicons name="keypad-outline" size={20} color={mode === 'manual' ? colors.primary : colors.textMuted} />
          <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Result Display */}
      {result && (
        <View style={[styles.resultCard, result.verified ? styles.resultSuccess : styles.resultError]}>
          <TouchableOpacity style={styles.resultClose} onPress={handleClearResult}>
            <Ionicons name="close" size={20} color={result.verified ? colors.accentGreen : colors.danger} />
          </TouchableOpacity>

          <View style={styles.resultHeader}>
            <View style={[styles.resultIcon, { backgroundColor: result.verified ? colors.accentGreen + '20' : colors.danger + '20' }]}>
              <Ionicons
                name={result.verified ? 'checkmark-circle' : 'close-circle'}
                size={40}
                color={result.verified ? colors.accentGreen : colors.danger}
              />
            </View>
            <Text style={[styles.resultTitle, { color: result.verified ? colors.accentGreen : colors.danger }]}>
              {result.verified ? 'VERIFIED' : 'ACCESS DENIED'}
            </Text>
          </View>

          {result.verified && result.visitor && (
            <View style={styles.visitorDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={18} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{result.visitor.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="home" size={18} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Flat:</Text>
                <Text style={styles.detailValue}>{result.visitor.flatNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="people" size={18} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Visiting:</Text>
                <Text style={styles.detailValue}>{result.visitor.hostName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="chatbubble" size={18} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Purpose:</Text>
                <Text style={styles.detailValue}>{getPurposeLabel(result.visitor.purpose)}</Text>
              </View>
              {result.visitor.expectedTime && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={18} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Expected:</Text>
                  <Text style={styles.detailValue}>{result.visitor.expectedTime}</Text>
                </View>
              )}
              <View style={styles.messageRow}>
                <Text style={styles.welcomeMessage}>{result.message}</Text>
              </View>
            </View>
          )}

          {!result.verified && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>{result.error}</Text>
              {result.usedAt && (
                <Text style={styles.errorSubtext}>
                  Used at: {new Date(result.usedAt).toLocaleString('en-IN')}
                </Text>
              )}
              {!result.usedAt && result.error === 'Invalid QR code' && (
                <Text style={styles.errorSubtext}>Please ask the visitor for a valid QR pass</Text>
              )}
              {!result.usedAt && result.error === 'QR pass has expired' && (
                <Text style={styles.errorSubtext}>Request a new pass from the resident</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Main Content */}
      {!result && (
        <View style={styles.mainContent}>
          {mode === 'scan' ? (
            <View style={styles.scannerPlaceholder}>
              <View style={styles.scannerFrame}>
                <View style={[styles.scannerCorner, styles.topLeft]} />
                <View style={[styles.scannerCorner, styles.topRight]} />
                <View style={[styles.scannerCorner, styles.bottomLeft]} />
                <View style={[styles.scannerCorner, styles.bottomRight]} />
                {verifying ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Ionicons name="qr-code" size={64} color={colors.primary} />
                )}
              </View>
              <Text style={styles.scannerText}>
                {verifying ? 'Verifying...' : 'Point camera at visitor QR code'}
              </Text>
              <Text style={styles.scannerSubtext}>
                Or use manual entry for token codes
              </Text>

              {/* Demo buttons for testing */}
              <View style={styles.demoButtons}>
                <Text style={styles.demoTitle}>Demo (paste token):</Text>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleVerify('test-valid-token')}
                >
                  <Text style={styles.demoBtnText}>Test Valid QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoBtn, styles.demoBtnDanger]}
                  onPress={() => handleVerify('test-used-token')}
                >
                  <Text style={styles.demoBtnText}>Test Used Token</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.manualContainer}>
              <View style={styles.manualCard}>
                <Ionicons name="keypad" size={48} color={colors.primary} />
                <Text style={styles.manualTitle}>Manual Token Entry</Text>
                <Text style={styles.manualSubtitle}>
                  Enter the visitor token code manually
                </Text>
                <TextInput
                  style={styles.tokenInput}
                  placeholder="Enter token code"
                  placeholderTextColor={colors.textMuted}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.verifyBtn, !token.trim() && styles.verifyBtnDisabled]}
                  onPress={handleManualSubmit}
                  disabled={verifying || !token.trim()}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={colors.textPrimary} />
                      <Text style={styles.verifyBtnText}>Verify Token</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="shield" size={16} color={colors.textMuted} />
        <Text style={styles.footerText}>
          Powered by BuzzLocal SocietyOS
        </Text>
      </View>
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  guardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accentGreen + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  guardBadgeText: { fontSize: 10, fontWeight: '700', color: colors.accentGreen, marginLeft: 4 },
  modeContainer: { flexDirection: 'row', padding: 16 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, marginHorizontal: 4, backgroundColor: colors.surface },
  modeBtnActive: { backgroundColor: colors.primary + '20' },
  modeBtnText: { marginLeft: 8, fontSize: 14, color: colors.textMuted },
  modeBtnTextActive: { color: colors.primary, fontWeight: '600' },
  resultCard: { marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  resultSuccess: { backgroundColor: colors.accentGreen + '15', borderWidth: 1, borderColor: colors.accentGreen + '40' },
  resultError: { backgroundColor: colors.danger + '15', borderWidth: 1, borderColor: colors.danger + '40' },
  resultClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: '800' },
  visitorDetails: { marginTop: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailLabel: { marginLeft: 8, fontSize: 14, color: colors.textSecondary, width: 80 },
  detailValue: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  messageRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.accentGreen + '30' },
  welcomeMessage: { fontSize: 15, fontWeight: '600', color: colors.accentGreen, textAlign: 'center' },
  errorDetails: { alignItems: 'center', marginTop: 8 },
  errorText: { fontSize: 15, fontWeight: '600', color: colors.danger },
  errorSubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  mainContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  scannerPlaceholder: { alignItems: 'center' },
  scannerFrame: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary + '40', borderRadius: 16 },
  scannerCorner: { position: 'absolute', width: 24, height: 24, borderColor: colors.primary },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  scannerText: { fontSize: 16, color: colors.textPrimary, marginTop: 24, textAlign: 'center' },
  scannerSubtext: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  demoButtons: { marginTop: 32, alignItems: 'center' },
  demoTitle: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  demoBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 8 },
  demoBtnDanger: { backgroundColor: colors.danger },
  demoBtnText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  manualContainer: { flex: 1, justifyContent: 'center' },
  manualCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 32, alignItems: 'center' },
  manualTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
  manualSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  tokenInput: { width: '100%', backgroundColor: colors.surfaceLight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.textPrimary, marginTop: 24, textAlign: 'center' },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, marginTop: 16 },
  verifyBtnDisabled: { backgroundColor: colors.textMuted },
  verifyBtnText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.surface },
  footerText: { marginLeft: 8, fontSize: 12, color: colors.textMuted },
});
