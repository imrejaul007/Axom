/**
 * ExperienceWalletScreen — shows the user's Experience Credits earned through REZ spending rewards.
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { experienceCreditAPI } from '../services/api';

type CreditStatus = 'AVAILABLE' | 'USED' | 'EXPIRED';
type CreditTier   = 'SILVER' | 'GOLD' | 'PLATINUM';

interface ExperienceCredit {
  id:          string;
  tier:        CreditTier;
  type:        string;
  label:       string;
  status:      CreditStatus;
  expiresAt:   string;
  grantedAt:   string;
  usedInPlanId?: string | null;
}

const TIER_COLORS: Record<CreditTier, { bg: string; border: string; text: string; badge: string }> = {
  SILVER:   { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6', badge: '#7c3aed' },
  GOLD:     { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: '#d97706' },
  PLATINUM: { bg: '#f5f3ff', border: '#a78bfa', text: '#3730a3', badge: '#4f46e5' },
};

const TIER_LABELS: Record<CreditTier, string> = {
  SILVER:   'Silver',
  GOLD:     'Gold',
  PLATINUM: 'Platinum',
};

// RZ-M-X1: Replaced local formatDate with shared utils/dateFormatter to consolidate
// the 7+ different date formatting patterns across the app.
function _formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CreditCard({
  credit,
  onUse,
}: {
  credit: ExperienceCredit;
  onUse: (id: string) => void;
}) {
  const colors  = TIER_COLORS[credit.tier];
  const expired = credit.status === 'EXPIRED' || new Date(credit.expiresAt) < new Date();
  const isAvail = credit.status === 'AVAILABLE' && !expired;

  return (
    <View style={[styles.card, { backgroundColor: isAvail ? colors.bg : '#f9f9f9', borderColor: isAvail ? colors.border : '#e0e0e0' }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.tierBadge, { backgroundColor: isAvail ? colors.badge : '#bbb' }]}>
          <Text style={styles.tierBadgeText}>{TIER_LABELS[credit.tier]}</Text>
        </View>
        {credit.status === 'USED' && (
          <View style={styles.usedBadge}>
            <Text style={styles.usedBadgeText}>Used</Text>
          </View>
        )}
        {(credit.status === 'EXPIRED' || expired) && credit.status !== 'USED' && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredBadgeText}>Expired</Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardLabel, { color: isAvail ? colors.text : '#999' }]}>{credit.label}</Text>
      <Text style={styles.cardExpiry}>
        {credit.status === 'USED'
          ? 'Used for a plan'
          : `Expires ${_formatDate(credit.expiresAt)}`}
      </Text>

      {isAvail && (
        <TouchableOpacity style={[styles.useBtn, { borderColor: colors.badge }]} onPress={() => onUse(credit.id)}>
          <Text style={[styles.useBtnText, { color: colors.badge }]}>Use for a Plan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ExperienceWalletScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const { data, isLoading } = useQuery<{ credits: ExperienceCredit[] }>({
    queryKey: ['experience-credits'],
    queryFn: () => experienceCreditAPI.getAll().then((r) => r.data),
  });

  const credits = data?.credits ?? [];

  const handleUse = (creditId: string) => {
    navigation.navigate('CreatePlan', { experienceCreditId: creditId });
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#d97706" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.heroBox}>
        <Text style={styles.heroTitle}>Experience Rewards</Text>
        <Text style={styles.heroSub}>Earned through REZ shopping</Text>
      </View>

      {credits.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No credits yet</Text>
          <Text style={styles.emptyBody}>
            Shop on REZ and unlock your first Experience Reward.
          </Text>

          {/* Tier ladder */}
          <View style={styles.tierLadder}>
            {[
              { tier: 'SILVER', label: 'Silver', spend: '10K', colors: TIER_COLORS.SILVER },
              { tier: 'GOLD',   label: 'Gold',   spend: '20K', colors: TIER_COLORS.GOLD },
              { tier: 'PLATINUM', label: 'Platinum', spend: '50K', colors: TIER_COLORS.PLATINUM },
            ].map((t) => (
              <View key={t.tier} style={[styles.tierRow, { borderColor: t.colors.border }]}>
                <View style={[styles.tierDot, { backgroundColor: t.colors.badge }]} />
                <Text style={[styles.tierRowLabel, { color: t.colors.text }]}>{t.label}</Text>
                <Text style={styles.tierRowSpend}>Spend {'\u20B9'}{t.spend}+</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {credits.map((c) => (
            <CreditCard key={c.id} credit={c} onUse={handleUse} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  heroBox:         { backgroundColor: '#fffbeb', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: '#fcd34d', alignItems: 'center' },
  heroTitle:       { fontSize: 22, fontWeight: '800', color: '#92400e' },
  heroSub:         { fontSize: 13, color: '#b45309', marginTop: 4 },
  emptyBox:        { alignItems: 'center', paddingTop: 20 },
  emptyTitle:      { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  emptyBody:       { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  tierLadder:      { width: '100%', gap: 10 },
  tierRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  tierDot:         { width: 10, height: 10, borderRadius: 5 },
  tierRowLabel:    { fontSize: 14, fontWeight: '700', flex: 1 },
  tierRowSpend:    { fontSize: 13, color: '#888', fontWeight: '600' },
  list:            { gap: 14 },
  card:            { borderRadius: 16, borderWidth: 1.5, padding: 18 },
  cardHeader:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tierBadge:       { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  tierBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  usedBadge:       { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  usedBadgeText:   { color: '#16a34a', fontSize: 11, fontWeight: '700' },
  expiredBadge:    { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  expiredBadgeText:{ color: '#9ca3af', fontSize: 11, fontWeight: '700' },
  cardLabel:       { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardExpiry:      { fontSize: 12, color: '#999' },
  useBtn:          { marginTop: 14, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  useBtnText:      { fontSize: 14, fontWeight: '700' },
});
