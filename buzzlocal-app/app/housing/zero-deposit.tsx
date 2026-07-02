import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const RENT_FINANCE_API = 'http://localhost:4022';

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

export default function ZeroDepositScreen() {
  const router = useRouter();
  const [credit, setCredit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      // Get credit score
      const scoreRes = await axios.get(`${RENT_FINANCE_API}/api/rentfinance/credit-score`, {
        headers: { 'x-user-id': 'demo-user' }
      });
      setCredit(scoreRes.data.credit);

      // Check eligibility for 1.2L deposit
      const checkRes = await axios.post(
        `${RENT_FINANCE_API}/api/rentfinance/check-eligibility`,
        { depositAmount: 120000 },
        { headers: { 'x-user-id': 'demo-user' } }
      );
      setEligibility(checkRes.data);
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'platinum': return colors.accentGold;
      case 'gold': return colors.accentGold;
      case 'silver': return colors.textSecondary;
      default: return '#CD7F32'; // bronze
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'platinum': return 'diamond';
      case 'gold': return 'medal';
      case 'silver': return 'medal-outline';
      default: return 'ribbon';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking your eligibility...</Text>
      </View>
    );
  }

  const score = credit?.score || 0;
  const level = credit?.level || 'bronze';
  const limit = credit?.limit || 0;
  const eligible = eligibility?.eligible;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Zero Deposit', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zero Deposit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Your Rent Credit Score</Text>
              <Text style={[styles.heroScore, { color: getLevelColor(level) }]}>
                {score}
              </Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(level) + '20' }]}>
              <Ionicons name={getLevelIcon(level) as any} size={24} color={getLevelColor(level)} />
              <Text style={[styles.levelText, { color: getLevelColor(level) }]}>
                {level?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Score Breakdown */}
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            {Object.entries(credit?.breakdown || {}).map(([key, value]) => (
              <View key={key} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}
                </Text>
                <View style={styles.breakdownBar}>
                  <View
                    style={[
                      styles.breakdownFill,
                      { width: `${(Number(value) / 40) * 100}%`, backgroundColor: getLevelColor(level) }
                    ]}
                  />
                </View>
                <Text style={styles.breakdownValue}>{value}/40</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Eligibility Result */}
        <View style={[styles.resultCard, eligible ? styles.resultCardSuccess : styles.resultCardFail]}>
          <View style={[styles.resultIcon, eligible ? styles.resultIconSuccess : styles.resultIconFail]}>
            <Ionicons
              name={eligible ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={eligible ? colors.accentGreen : colors.danger}
            />
          </View>
          <Text style={[styles.resultTitle, eligible ? styles.resultTitleSuccess : styles.resultTitleFail]}>
            {eligible ? 'You Are Eligible!' : 'Not Yet Eligible'}
          </Text>
          <Text style={styles.resultMessage}>
            {eligibility?.message || 'Build your score to unlock zero deposit'}
          </Text>
        </View>

        {/* Deposit Amount */}
        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Traditional Deposit</Text>
              <Text style={styles.amountTraditional}>Rs 1,20,000</Text>
            </View>
            <View style={styles.amountVs}>
              <Text style={styles.amountVsText}>vs</Text>
            </View>
            <View style={[styles.amountRight, eligible && styles.amountRightEligible]}>
              <Text style={styles.amountLabel}>With Habixo</Text>
              <Text style={[styles.amountZero, eligible && styles.amountZeroEligible]}>Rs 0</Text>
            </View>
          </View>
        </View>

        {/* Trust Levels */}
        <View style={styles.levelsCard}>
          <Text style={styles.levelsTitle}>Trust Levels</Text>
          {['bronze', 'silver', 'gold', 'platinum'].map((lvl, i) => (
            <View key={lvl} style={[styles.levelRow, level === lvl && styles.levelRowActive]}>
              <View style={styles.levelLeft}>
                <Ionicons name={getLevelIcon(lvl) as any} size={20} color={getLevelColor(lvl)} />
                <Text style={[styles.levelName, level === lvl && { color: colors.textPrimary }]}>
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </Text>
              </View>
              <View style={styles.levelRight}>
                <Text style={styles.levelScore}>
                  {lvl === 'bronze' ? '0-49' : lvl === 'silver' ? '50-74' : lvl === 'gold' ? '75-89' : '90+'}
                </Text>
                <Text style={styles.levelLimit}>
                  Rs {(i === 0 ? 50000 : i === 1 ? 150000 : i === 2 ? 300000 : 500000).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* How to Build Score */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>How to Build Your Score</Text>
          <View style={styles.tip}>
            <Ionicons name="time" size={20} color={colors.accentGreen} />
            <Text style={styles.tipText}>Pay rent on time every month</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="calendar" size={20} color={colors.accentGreen} />
            <Text style={styles.tipText}>Stay longer to increase tenure score</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="shield-checkmark" size={20} color={colors.accentGreen} />
            <Text style={styles.tipText}>Verify your income and documents</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="people" size={20} color={colors.accentGreen} />
            <Text style={styles.tipText}>Build social connections in your society</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      {eligible && (
        <View style={styles.ctaBar}>
          <TouchableOpacity style={styles.ctaBtn}>
            <Ionicons name="checkmark-circle" size={20} color={colors.textPrimary} />
            <Text style={styles.ctaBtnText}>Apply for Zero Deposit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: colors.surface },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  heroCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { fontSize: 14, color: colors.textSecondary },
  heroScore: { fontSize: 64, fontWeight: '800', marginTop: 4 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  levelText: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
  breakdown: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.surfaceLight },
  breakdownTitle: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  breakdownLabel: { width: 120, fontSize: 12, color: colors.textSecondary },
  breakdownBar: { flex: 1, height: 8, backgroundColor: colors.surfaceLight, borderRadius: 4 },
  breakdownFill: { height: '100%', borderRadius: 4 },
  breakdownValue: { width: 40, fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  resultCard: { borderRadius: 20, padding: 24, marginTop: 16, alignItems: 'center' },
  resultCardSuccess: { backgroundColor: colors.accentGreen + '15' },
  resultCardFail: { backgroundColor: colors.danger + '15' },
  resultIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resultIconSuccess: { backgroundColor: colors.accentGreen + '20' },
  resultIconFail: { backgroundColor: colors.danger + '20' },
  resultTitle: { fontSize: 22, fontWeight: '800' },
  resultTitleSuccess: { color: colors.accentGreen },
  resultTitleFail: { color: colors.danger },
  resultMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  amountCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginTop: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountLabel: { fontSize: 12, color: colors.textMuted },
  amountTraditional: { fontSize: 24, fontWeight: '700', color: colors.danger, marginTop: 4 },
  amountVs: { flex: 1, alignItems: 'center' },
  amountVsText: { color: colors.textMuted, fontSize: 12 },
  amountRight: { alignItems: 'flex-end' },
  amountRightEligible: {},
  amountZero: { fontSize: 24, fontWeight: '700', color: colors.textMuted, marginTop: 4 },
  amountZeroEligible: { color: colors.accentGreen },
  levelsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginTop: 16 },
  levelsTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 16 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceLight },
  levelRowActive: { backgroundColor: colors.primary + '10', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 8, borderBottomWidth: 0 },
  levelLeft: { flexDirection: 'row', alignItems: 'center' },
  levelName: { fontSize: 14, color: colors.textSecondary, marginLeft: 10 },
  levelRight: { alignItems: 'flex-end' },
  levelScore: { fontSize: 12, color: colors.textMuted },
  levelLimit: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  tipsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginTop: 16 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 16 },
  tip: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipText: { fontSize: 14, color: colors.textSecondary, marginLeft: 12, flex: 1 },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.surfaceLight },
  ctaBtn: { backgroundColor: colors.accentGreen, borderRadius: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginLeft: 8 },
});
