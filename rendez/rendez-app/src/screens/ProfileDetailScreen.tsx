/**
 * ProfileDetailScreen
 * Reached from DiscoverScreen (swipe card tap) and anywhere a profileId is available.
 * Fetches the full profile from /profile/:id, shows photos, trust badges,
 * bio, intent, and Like / Pass / Report / Block actions.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, Dimensions, Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { profileAPI, matchAPI, safetyAPI } from '../services/api';

const { width } = Dimensions.get('window');

const INTENT_LABEL: Record<string, string> = {
  DATING: '💘 Dating',
  FRIENDSHIP: '🤝 Friendship',
  NETWORKING: '💼 Networking',
};
const GENDER_LABEL: Record<string, string> = {
  MALE: 'Man', FEMALE: 'Woman', NON_BINARY: 'Non-binary',
};

// ─── Match celebration modal (same visual language as DiscoverScreen) ─────────

function MatchModal({
  visible, name, photo,
  onMessage, onClose,
}: {
  visible: boolean; name: string; photo?: string;
  onMessage: () => void; onClose: () => void;
}) {
  const scale   = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value   = withDelay(200, withSpring(1, { damping: 9 }));
      opacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    } else {
      scale.value = 0.6; opacity.value = 0;
    }
  }, [visible]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }], opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <Animated.View style={[ms.box, boxStyle]}>
          <Text style={ms.emoji}>💜</Text>
          <Text style={ms.title}>It's a Match!</Text>
          <Text style={ms.sub}>You and {name} liked each other</Text>
          {photo && <Image source={{ uri: photo }} style={ms.avatar} />}
          <TouchableOpacity style={ms.msgBtn} onPress={onMessage}>
            <Text style={ms.msgBtnText}>Send a Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.keepBtn} onPress={onClose}>
            <Text style={ms.keepBtnText}>Keep Browsing</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(20,0,50,0.9)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:      { backgroundColor: '#1a1a2e', borderRadius: 28, padding: 36, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#4c1d95' },
  emoji:    { fontSize: 52, marginBottom: 10 },
  title:    { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 6 },
  sub:      { fontSize: 15, color: '#c4b5fd', marginBottom: 24, textAlign: 'center' },
  avatar:   { width: 80, height: 80, borderRadius: 40, marginBottom: 24, borderWidth: 2, borderColor: '#7c3aed' },
  msgBtn:   { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginBottom: 10 },
  msgBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  keepBtn:  { borderWidth: 1.5, borderColor: '#4c1d95', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  keepBtnText: { color: '#c4b5fd', fontWeight: '600', fontSize: 14 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

interface TrustSignals {
  trustLevel:      'UNVERIFIED' | 'VERIFIED' | 'BRONZE' | 'SILVER' | 'GOLD';
  trustLevelLabel: string;
  responseLabel:  'SLUGGISH' | 'SLOW' | 'RESPONSIVE' | 'QUICK' | 'LIKELY_TO_REPLY';
  responsePercent: number;
  activeLabel:    'ACTIVE_TODAY' | 'ACTIVE_THIS_WEEK' | 'ACTIVE_THIS_MONTH' | 'INACTIVE';
  lastActiveAt:   string | null;
  profileCompleteness: number;
}

interface Profile {
  id: string; name: string; age: number; gender: string;
  city: string; bio?: string; photos: string[];
  intent: string; isVerified: boolean; profileScore: number;
  meetupCount?: number; responseRate?: number;
  trustSignals?: TrustSignals;
}

export default function ProfileDetailScreen({
  route, navigation,
}: {
  route: { params: { profileId: string } };
  navigation: { goBack: () => void; navigate: (s: string, p?: object) => void };
}) {
  const { profileId } = route.params;
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery<Profile>({
    queryKey: ['profile', profileId],
    queryFn: () => profileAPI.getById(profileId).then((r) => r.data),
    retry: 1,
  });

  const likeMutation = useMutation({
    mutationFn: () => matchAPI.like(profileId),
    onSuccess: (res) => {
      if (res.data.matched) {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        setShowMatch(true);
      } else {
        navigation.goBack();
      }
    },
    onError: () => Alert.alert('Error', 'Could not send like. Please try again.'),
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) => safetyAPI.report(profileId, reason),
    onSuccess: () => Alert.alert('Reported', 'Thank you. Our team will review this.'),
  });

  const blockMutation = useMutation({
    mutationFn: () => safetyAPI.block(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      navigation.goBack();
    },
  });

  const handleReport = () => {
    Alert.alert('Report', 'Why are you reporting this profile?', [
      { text: 'Fake profile',            onPress: () => reportMutation.mutate('FAKE_PROFILE') },
      { text: 'Harassment',              onPress: () => reportMutation.mutate('HARASSMENT') },
      { text: 'Spam',                    onPress: () => reportMutation.mutate('SPAM') },
      { text: 'Inappropriate content',   onPress: () => reportMutation.mutate('INAPPROPRIATE_CONTENT') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleBlock = () => {
    if (!profile) return;
    Alert.alert('Block', `Block ${profile.name}? They won't see you or be able to contact you.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => blockMutation.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#888', fontSize: 16 }}>Profile not available</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#7c3aed', fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // R2-M17 + RD-L-09 FIX: Guard against null/undefined photos array.
  const hasPhotos = (profile.photos?.length ?? 0) > 0;
  const photo     = hasPhotos ? (profile.photos?.[photoIdx] ?? null) : null;
  const signals   = profile.trustSignals;

  return (
    <>
      <View style={styles.container}>
        <ScrollView bounces={false}>
          {/* Photos */}
          <View style={styles.photoContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={styles.noPhoto}>
                {/* RZ-M-E1 FIX: Guard against empty name. profile.name may be '' after
                 * initial render before profile data loads. Using optional chaining + '?' */}
                <Text style={styles.noPhotoText}>{profile.name?.[0] ?? '?'}</Text>
              </View>
            )}

            {/* Photo dot indicators */}
            {(profile.photos?.length ?? 0) > 1 && (
              <View style={styles.dots}>
                {(profile.photos ?? []).map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                    <View style={[styles.dot, i === photoIdx && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Tap left/right to navigate photos */}
            <TouchableOpacity
              style={styles.photoLeft}
              onPress={() => setPhotoIdx((i) => Math.max(0, i - 1))}
            />
            <TouchableOpacity
              style={styles.photoRight}
              onPress={() => setPhotoIdx((i) => Math.min((profile.photos?.length ?? 0) - 1, i + 1))}
            />

            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.info}>
            {/* Name + verified */}
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}, {profile.age}</Text>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ REZ</Text>
                </View>
              )}
            </View>

            {/* Trust badges — powered by computed trustSignals */}
            {signals && (
              <View style={styles.trustRow}>
                {/* Trust tier badge */}
                {signals.trustLevel !== 'UNVERIFIED' && (
                  <View style={[styles.trustBadge, TRUST_BADGE_COLORS[signals.trustLevel]]}>
                    <Text style={[styles.trustText, TRUST_BADGE_TEXT_COLORS[signals.trustLevel]]}>
                      ★ {signals.trustLevelLabel}
                    </Text>
                  </View>
                )}
                {/* Response rate */}
                {signals.responsePercent >= 50 && (
                  <View style={[styles.trustBadge, RESPONSE_BADGE_COLORS[signals.responseLabel]]}>
                    <Text style={[styles.trustText, RESPONSE_BADGE_TEXT_COLORS[signals.responseLabel]]}>
                      {RESPONSE_ICONS[signals.responseLabel]} {signals.responsePercent}% response
                    </Text>
                  </View>
                )}
                {/* Profile completeness */}
                {signals.profileCompleteness >= 60 && (
                  <View style={[styles.trustBadge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.trustText, { color: '#92400e' }]}>
                      📋 {signals.profileCompleteness}% complete
                    </Text>
                  </View>
                )}
                {/* Active status */}
                {signals.activeLabel === 'ACTIVE_TODAY' && (
                  <View style={[styles.trustBadge, { backgroundColor: '#d1fae5' }]}>
                    <Text style={[styles.trustText, { color: '#065f46' }]}>🟢 Active now</Text>
                  </View>
                )}
                {signals.activeLabel === 'ACTIVE_THIS_WEEK' && (
                  <View style={[styles.trustBadge, { backgroundColor: '#d1fae5' }]}>
                    <Text style={[styles.trustText, { color: '#065f46' }]}>🟡 Active this week</Text>
                  </View>
                )}
              </View>
            )}

            {/* Meta pills */}
            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>📍 {profile.city}</Text>
              <Text style={styles.metaItem}>👤 {GENDER_LABEL[profile.gender] || profile.gender}</Text>
              <Text style={styles.metaItem}>{INTENT_LABEL[profile.intent] || profile.intent}</Text>
            </View>

            {/* Bio */}
            {profile.bio ? (
              <View style={styles.bioSection}>
                <Text style={styles.bioLabel}>About</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : null}

            {/* Safety actions */}
            <View style={styles.safetyRow}>
              <TouchableOpacity style={styles.safetyBtn} onPress={handleReport} disabled={reportMutation.isPending}>
                <Text style={styles.safetyText}>🚩 Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.safetyBtn} onPress={handleBlock} disabled={blockMutation.isPending}>
                <Text style={styles.safetyText}>🚫 Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Fixed bottom: Like / Pass */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.passBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.passBtnText}>✕  Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            {likeMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.likeBtnText}>♥  Like</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Match modal */}
      <MatchModal
        visible={showMatch}
        name={profile.name}
        photo={profile.photos[0]}
        onMessage={() => {
          setShowMatch(false);
          navigation.navigate('Matches');
        }}
        onClose={() => { setShowMatch(false); navigation.goBack(); }}
      />
    </>
  );
}

// ─── Trust Badge Constants ────────────────────────────────────────────────────────

const TRUST_BADGE_COLORS: Record<string, string> = {
  VERIFIED:  '#e0e7ff',
  BRONZE:    '#fef3c7',
  SILVER:    '#e5e7eb',
  GOLD:      '#fef9c3',
};
const TRUST_BADGE_TEXT_COLORS: Record<string, string> = {
  VERIFIED:  '#3730a3',
  BRONZE:    '#92400e',
  SILVER:    '#374151',
  GOLD:      '#854d0e',
};
const RESPONSE_BADGE_COLORS: Record<string, string> = {
  RESPONSIVE:       '#d1fae5',
  QUICK:            '#bbf7d0',
  LIKELY_TO_REPLY:  '#86efac',
  SLOW:             '#fef9c3',
  SLUGGISH:         '#fee2e2',
};
const RESPONSE_BADGE_TEXT_COLORS: Record<string, string> = {
  RESPONSIVE:       '#065f46',
  QUICK:            '#15803d',
  LIKELY_TO_REPLY:  '#166534',
  SLOW:             '#92400e',
  SLUGGISH:         '#991b1b',
};
const RESPONSE_ICONS: Record<string, string> = {
  RESPONSIVE:       '⚡',
  QUICK:             '⚡⚡',
  LIKELY_TO_REPLY:   '💬',
  SLOW:             '🐢',
  SLUGGISH:         '🔇',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  photoContainer: { width, height: width * 1.2, backgroundColor: '#f3e8ff', position: 'relative' },
  photo:          { width: '100%', height: '100%' },
  noPhoto:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3e8ff' },
  noPhotoText:    { fontSize: 80, color: '#7c3aed' },
  dots:           { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:      { backgroundColor: '#fff', width: 20 },
  photoLeft:      { position: 'absolute', left: 0, top: 0, width: '40%', height: '100%' },
  photoRight:     { position: 'absolute', right: 0, top: 0, width: '60%', height: '100%' },
  backBtn:        { position: 'absolute', top: 52, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  backBtnText:    { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '700', marginLeft: 2 },

  info:           { padding: 20, paddingBottom: 24 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  name:           { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },
  verifiedBadge:  { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  verifiedText:   { color: '#fff', fontSize: 11, fontWeight: '700' },

  trustRow:       { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  trustBadge:     { backgroundColor: '#f0e6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trustText:      { fontSize: 12, color: '#7c3aed', fontWeight: '700' },
  trustBadgeGreen: { backgroundColor: '#d1fae5' },
  trustTextGreen: { color: '#059669' },

  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metaItem:       { fontSize: 13, color: '#666', backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },

  bioSection:     { marginBottom: 20 },
  bioLabel:       { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  bioText:        { fontSize: 15, color: '#444', lineHeight: 22 },

  safetyRow:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  safetyBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  safetyText:     { fontSize: 13, color: '#888' },

  footer:         { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  passBtn:        { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#eee', alignItems: 'center' },
  passBtnText:    { fontSize: 16, fontWeight: '700', color: '#888' },
  likeBtn:        { flex: 2, paddingVertical: 16, borderRadius: 14, backgroundColor: '#7c3aed', alignItems: 'center' },
  likeBtnText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});
