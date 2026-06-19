/**
 * PlanConfirmScreen — both organizer and selected applicant confirm attendance
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatDate, formatTime } from '../utils/dateFormatter';

export default function PlanConfirmScreen({
  route, navigation,
}: {
  route: { params: { planId: string } };
  navigation: { goBack: () => void; navigate: (s: string, p?: object) => void };
}) {
  const { planId } = route.params;
  const { profile } = useAuthStore();
  const qc = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => planAPI.getDetail(planId).then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: () => planAPI.confirm(planId).then((r) => r.data),
    onSuccess: ({ confirmed, coinsCredited }) => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['my-plans'] });
      if (coinsCredited) {
        Alert.alert(
          'Confirmed! ✓ + Coins Earned! 🪙',
          `You're confirmed for this meetup and earned ${plan.sponsorPerAttendeeCoins} REZ coins.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Confirmed! ✓', "You're confirmed for this meetup. See you there!", [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      Alert.alert('Error', err.response?.data?.message || 'Could not confirm'),
  });

  if (isLoading || !plan) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;
  }

  const alreadyConfirmed = plan.confirmations?.some((c: { profileId: string }) => c.profileId === profile?.id);
  const bothConfirmed    = plan.confirmations?.length >= 2;
  const deadline         = new Date(plan.confirmationDeadline);
  const hoursLeft        = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 3600000));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{plan.title}</Text>
        <Text style={styles.subtitle}>{plan.merchantName}</Text>

        <Text style={styles.schedText}>
          {formatDate(plan.scheduledAt, 'full')}
          {' at '}
          {formatTime(plan.scheduledAt)}
        </Text>

        <View style={styles.divider} />

        <View style={styles.confirmStatusRow}>
          <ConfirmDot label="Organiser" confirmed={plan.confirmations?.some((c: { profileId: string }) => c.profileId === plan.organizer.id)} />
          <View style={styles.connectorLine} />
          <ConfirmDot label="Guest" confirmed={(plan.confirmations?.some((c: { profileId: string }) => c.profileId !== plan.organizer.id)) ?? false} />
        </View>

        {!alreadyConfirmed && !bothConfirmed && (
          <>
            {plan.isSponsored && plan.sponsorPerAttendeeCoins > 0 && (
              <View style={styles.sponsorCallout}>
                <Text style={styles.sponsorEmoji}>🏪</Text>
                <View>
                  <Text style={styles.sponsorTitle}>Merchant Sponsored!</Text>
                  <Text style={styles.sponsorSub}>You'll earn {plan.sponsorPerAttendeeCoins} REZ coins for confirming</Text>
                </View>
              </View>
            )}
            <Text style={styles.deadlineText}>
              Confirm before deadline: {deadline.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              {hoursLeft <= 2 && <Text style={styles.urgentText}> · Only {hoursLeft}h left!</Text>}
            </Text>

            <TouchableOpacity
              style={[styles.confirmBtn, confirmMutation.isPending && { opacity: 0.5 }]}
              onPress={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmBtnText}>Yes, I'll be there ✓</Text>}
            </TouchableOpacity>
          </>
        )}

        {alreadyConfirmed && !bothConfirmed && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>⏳ Waiting for the other person to confirm</Text>
          </View>
        )}

        {bothConfirmed && (
          <View style={styles.allConfirmedBox}>
            <Text style={styles.allConfirmedText}>🎊 Both confirmed! See you there.</Text>
            {plan.matchId && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => navigation.navigate('Chat', { matchId: plan.matchId, matchName: 'Your date' })}
              >
                <Text style={styles.chatBtnText}>Open Chat to coordinate →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function ConfirmDot({ label, confirmed }: { label: string; confirmed: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.dot, confirmed && styles.dotConfirmed]}>
        {confirmed && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}
      </View>
      <Text style={styles.dotLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fafafa', justifyContent: 'center', padding: 20 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:             { backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#7c3aed', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  emoji:            { fontSize: 52, marginBottom: 12 },
  title:            { fontSize: 20, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 4 },
  subtitle:         { fontSize: 14, color: '#888', marginBottom: 8 },
  schedText:        { fontSize: 15, color: '#7c3aed', fontWeight: '600', textAlign: 'center' },
  divider:          { width: '100%', height: 1, backgroundColor: '#f0e6ff', marginVertical: 20 },
  confirmStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  connectorLine:    { flex: 1, height: 2, backgroundColor: '#e9d5ff', marginHorizontal: 12 },
  dot:              { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  dotConfirmed:     { backgroundColor: '#059669' },
  dotLabel:         { fontSize: 11, color: '#888', fontWeight: '600' },
  deadlineText:     { fontSize: 12, color: '#888', marginBottom: 16, textAlign: 'center' },
  sponsorCallout:   { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0', width: '100%' },
  sponsorEmoji:    { fontSize: 24 },
  sponsorTitle:    { fontSize: 13, fontWeight: '800', color: '#15803d' },
  sponsorSub:      { fontSize: 12, color: '#166534', marginTop: 1 },
  urgentText:       { color: '#ef4444', fontWeight: '700' },
  confirmBtn:       { width: '100%', backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  waitingBox:       { backgroundColor: '#fef9c3', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  waitingText:      { color: '#d97706', fontWeight: '600', fontSize: 14 },
  allConfirmedBox:  { backgroundColor: '#d1fae5', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', gap: 12 },
  allConfirmedText: { color: '#059669', fontWeight: '700', fontSize: 15 },
  chatBtn:          { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  chatBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
});
