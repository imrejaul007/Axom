/**
 * PlanDetailScreen — view plan + apply / withdraw
 */

import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../utils/dateFormatter';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, ActivityIndicator, Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORY_EMOJI: Record<string, string> = {
  DINNER: '🍽️', LUNCH: '🥗', BREAKFAST: '☕', BRUNCH: '🥞',
  SPA: '💆', SALON: '💅', SHOPPING: '🛍️',
  BADMINTON: '🏸', SPORTS: '⚽', GAMING: '🎮',
};

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Apply success celebration modal ─────────────────────────────────────────

function AppliedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scale   = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value   = withDelay(100, withSpring(1, { damping: 10 }));
      opacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    }
  }, [visible]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={celebStyles.overlay}>
        {/* Simple confetti dots */}
        {['#7c3aed','#ec4899','#f59e0b','#10b981','#3b82f6'].map((c, i) => (
          <View key={i} style={[celebStyles.dot, {
            top: 80 + ((i * 1337 + 37) % 200), left: 20 + i * (SCREEN_W / 5),
            backgroundColor: c, width: 10, height: 10,
          }]} />
        ))}
        <Animated.View style={[celebStyles.box, boxStyle]}>
          <Text style={celebStyles.emoji}>🎉</Text>
          <Text style={celebStyles.title}>Applied!</Text>
          <Text style={celebStyles.sub}>The organiser will be notified.{'\n'}Good luck!</Text>
          <TouchableOpacity style={celebStyles.btn} onPress={onClose}>
            <Text style={celebStyles.btnText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const celebStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dot:     { position: 'absolute', borderRadius: 5 },
  box:     { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: SCREEN_W * 0.75 },
  emoji:   { fontSize: 52, marginBottom: 12 },
  title:   { fontSize: 26, fontWeight: '900', color: '#1a1a2e', marginBottom: 8 },
  sub:     { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn:     { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────

import { SMART_PROMPTS } from '@/constants';

export default function PlanDetailScreen({
  route, navigation,
}: {
  route: { params: { planId: string } };
  navigation: { navigate: (s: string, p?: object) => void; goBack: () => void };
}) {
  const { planId } = route.params;
  const { profile } = useAuthStore();
  const qc          = useQueryClient();

  const [note, setNote]              = useState('');
  const [showApply, setShowApply]    = useState(false);
  const [showApplied, setShowApplied] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => planAPI.getDetail(planId).then((r) => r.data),
  });

  const applyMutation = useMutation({
    mutationFn: () => planAPI.apply(planId, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['my-plans'] });
      setShowApply(false);
      setShowApplied(true);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      Alert.alert('Could not apply', err.response?.data?.message || 'Please try again'),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => planAPI.withdraw(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['my-plans'] });
      Alert.alert('Withdrawn', 'Your application has been removed');
    },
    onError: () => Alert.alert('Error', 'Could not withdraw'),
  });

  if (isLoading || !plan) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;
  }

  const myApp      = plan.applications?.[0];
  const isOrganizer = plan.organizer.id === profile?.id;
  const schedDate  = new Date(plan.scheduledAt);
  const isPast     = new Date() > new Date(plan.expiresAt);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Organizer */}
        <View style={styles.organizerRow}>
          <Image
            source={{ uri: plan.organizer.photos[0] || 'https://ui-avatars.com/api/?size=80' }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.organizerName}>{plan.organizer.name}, {plan.organizer.age}</Text>
              {plan.organizer.isVerified && <Text style={styles.verified}>✓</Text>}
            </View>
            <Text style={styles.organizerCity}>{plan.organizer.city}</Text>
          </View>
          <Text style={{ fontSize: 36 }}>{CATEGORY_EMOJI[plan.category] || '📅'}</Text>
        </View>

        {/* Title */}
        <Text style={styles.planTitle}>{plan.title}</Text>

        {/* Meta */}
        <View style={styles.metaCard}>
          <MetaRow icon="📅" label={formatDate(schedDate, 'full')} />
          <MetaRow icon="🕐" label={formatTime(schedDate)} />
          <MetaRow icon="📍" label={plan.merchantName} />
          <MetaRow icon="🏙️" label={plan.city} />
          {plan.vibe && <MetaRow icon="✨" label={plan.vibe} />}
          {plan.verifiedOnly && <MetaRow icon="🛡️" label="Verified users only" />}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Applied" value={plan.applicantCount} />
          <StatBox label="Views" value={plan.viewsCount} />
          <StatBox label="Status" value={plan.status} />
        </View>

        {/* P3: Merchant-sponsored reward callout */}
        {plan.isSponsored && plan.sponsorPerAttendeeCoins > 0 && (
          <View style={styles.sponsorCallout}>
            <Text style={styles.sponsorEmoji}>🏪</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.sponsorTitle}>Merchant Sponsored!</Text>
              <Text style={styles.sponsorSub}>
                Get {plan.sponsorPerAttendeeCoins} REZ coins when you confirm attendance.
                {plan.sponsorBudgetCoins > 0 && ` Limited budget — first come, first served.`}
              </Text>
            </View>
          </View>
        )}

        {/* Organizer actions */}
        {isOrganizer && plan.status === 'OPEN' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Applicants', { planId })}
          >
            <Text style={styles.primaryBtnText}>View Applicants ({plan.applicantCount})</Text>
          </TouchableOpacity>
        )}

        {isOrganizer && plan.status === 'FILLED' && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => navigation.navigate('PlanConfirm', { planId })}
          >
            <Text style={styles.primaryBtnText}>Confirm Attendance ✓</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Applicant actions — fixed bottom */}
      {!isOrganizer && !isPast && plan.status === 'OPEN' && (
        <View style={styles.bottomBar}>
          {!myApp && (
            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowApply(true)}>
              <Text style={styles.applyBtnText}>Apply to this Plan</Text>
            </TouchableOpacity>
          )}
          {myApp?.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
            </TouchableOpacity>
          )}
          {myApp?.status === 'SELECTED' && (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => navigation.navigate('PlanConfirm', { planId })}
            >
              <Text style={styles.primaryBtnText}>Confirm Attendance ✓</Text>
            </TouchableOpacity>
          )}
          {myApp?.status === 'REJECTED' && (
            <View style={styles.rejectedBadge}>
              <Text style={styles.rejectedText}>Not selected for this plan</Text>
            </View>
          )}
        </View>
      )}

      {/* Apply success celebration */}
      <AppliedModal visible={showApplied} onClose={() => setShowApplied(false)} />

      {/* Apply modal */}
      <Modal visible={showApply} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Apply to this plan</Text>
            <Text style={styles.modalSub}>Add a note — it boosts your ranking</Text>

            <Text style={styles.label}>Smart prompts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {SMART_PROMPTS.map((p) => (
                <TouchableOpacity key={p} style={styles.promptChip} onPress={() => setNote(p)}>
                  <Text style={styles.promptText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Or write your own message..."
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{note.length}/500</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowApply(false)}>
                <Text style={{ color: '#555', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { flex: 1 }, applyMutation.isPending && { opacity: 0.5 }]}
                onPress={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.applyBtnText}>Apply Now</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MetaRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 14, color: '#444' }}>{label}</Text>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  organizerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar:         { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0e6ff' },
  organizerName:  { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  verified:       { fontSize: 14, color: '#7c3aed', fontWeight: '800' },
  organizerCity:  { fontSize: 13, color: '#888', marginTop: 2 },
  planTitle:      { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
  metaCard:       { backgroundColor: '#faf5ff', borderRadius: 14, padding: 16, marginBottom: 16 },
  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  sponsorCallout: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  sponsorEmoji:   { fontSize: 28 },
  sponsorTitle:   { fontSize: 14, fontWeight: '800', color: '#15803d', marginBottom: 2 },
  sponsorSub:      { fontSize: 12, color: '#166534', lineHeight: 17 },
  statBox:        { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue:      { fontSize: 18, fontWeight: '800', color: '#7c3aed' },
  statLabel:      { fontSize: 11, color: '#888', marginTop: 2 },
  primaryBtn:     { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtn:     { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f0e6ff' },
  applyBtn:       { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  applyBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  withdrawBtn:    { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#ef4444' },
  withdrawBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  rejectedBadge:  { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, alignItems: 'center' },
  rejectedText:   { color: '#ef4444', fontWeight: '600' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle:     { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  modalSub:       { fontSize: 13, color: '#888', marginBottom: 16 },
  label:          { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  promptChip:     { backgroundColor: '#f0e6ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  promptText:     { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  noteInput:      { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  charCount:      { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 },
  cancelBtn:      { borderWidth: 1.5, borderColor: '#eee', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
});
