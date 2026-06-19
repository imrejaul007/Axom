import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Image, Modal,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  runOnJS, interpolate, Extrapolation,
  withTiming, withDelay, useAnimatedProps,
} from 'react-native-reanimated';
import {
  GestureDetector, Gesture, GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoverAPI, matchAPI } from '../services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.35;
const CARD_H = SCREEN_H * 0.62;

// ─── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

// Deterministic pseudo-random seeded by particle index (avoids Math.random() for IDs).
// Safe for animation — values remain consistent across re-renders.
function confettiRand(seed: number, offset: number): number {
  const x = Math.sin(seed * 9301 + offset) * 10000;
  return x - Math.floor(x);
}

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const seed = delay; // use delay as seed for consistency across re-renders
  const startX = (confettiRand(seed, 0) - 0.5) * SCREEN_W;
  const endX   = startX + (confettiRand(seed, 1) - 0.5) * SCREEN_W * 0.6;
  const endY   = SCREEN_H * 0.8;
  const rotate = confettiRand(seed, 2) * 720 - 360;
  const size   = 8 + confettiRand(seed, 3) * 8;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1200 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [SCREEN_W / 2 + startX, SCREEN_W / 2 + endX]) },
      { translateY: interpolate(progress.value, [0, 1], [SCREEN_H * 0.45, endY]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, rotate])}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.7, 1], [1, 1, 0]),
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: size, height: size * 0.6,
        backgroundColor: color,
        borderRadius: 2,
        top: 0, left: 0,
      }, style]}
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 32 }, (_, i) => ({
    key: i,
    delay: (i * 127 + 37) % 300,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => <ConfettiParticle key={p.key} delay={p.delay} color={p.color} />)}
    </View>
  );
}

// ─── Match Modal ───────────────────────────────────────────────────────────────

function MatchModal({
  visible,
  matchedProfile,
  onSendMessage,
  onKeepSwiping,
}: {
  visible: boolean;
  matchedProfile: Profile | null;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}) {
  const titleScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      titleScale.value = withDelay(300, withSpring(1, { damping: 8 }));
      titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    } else {
      titleScale.value = 0;
      titleOpacity.value = 0;
    }
  }, [visible]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  if (!matchedProfile) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={matchStyles.overlay}>
        <Confetti />

        {/* Hearts bg decoration */}
        <Text style={matchStyles.bgHeart1}>💜</Text>
        <Text style={matchStyles.bgHeart2}>💜</Text>

        <Animated.Text style={[matchStyles.matchTitle, titleStyle]}>
          It's a Match! 💜
        </Animated.Text>
        <Text style={matchStyles.matchSub}>You both liked each other</Text>

        {/* Avatar pair */}
        <View style={matchStyles.avatarRow}>
          <View style={matchStyles.avatarWrap}>
            <View style={[matchStyles.avatarRing, { borderColor: '#7c3aed' }]}>
              <View style={matchStyles.avatarPlaceholder}>
                <Text style={matchStyles.avatarInitial}>Me</Text>
              </View>
            </View>
          </View>

          <Text style={matchStyles.heartIcon}>💜</Text>

          <View style={matchStyles.avatarWrap}>
            <View style={[matchStyles.avatarRing, { borderColor: '#ec4899' }]}>
              {matchedProfile.photos?.[0] ? (
                <Image source={{ uri: matchedProfile.photos[0] }} style={matchStyles.avatarImg} />
              ) : (
                <View style={matchStyles.avatarPlaceholder}>
                  <Text style={matchStyles.avatarInitial}>{matchedProfile.name?.[0] ?? '?'}</Text>
                </View>
              )}
            </View>
            <Text style={matchStyles.avatarName}>{matchedProfile.name}</Text>
          </View>
        </View>

        <TouchableOpacity style={matchStyles.msgBtn} onPress={onSendMessage}>
          <Text style={matchStyles.msgBtnText}>Send a Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={matchStyles.keepBtn} onPress={onKeepSwiping}>
          <Text style={matchStyles.keepBtnText}>Keep Swiping</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  id: string;
  name: string;
  age: number;
  city: string;
  bio?: string;
  photos: string[];
  isVerified: boolean;
  responseRate?: number;
  meetupCount?: number;
  trustSignals?: TrustSignals;
}

// ─── Swipe Card ────────────────────────────────────────────────────────────────

function SwipeCard({
  profile,
  onLike,
  onPass,
  onTap,
}: {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
  onTap: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_W * 1.5, { damping: 14 });
        runOnJS(onLike)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_W * 1.5, { damping: 14 });
        runOnJS(onPass)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const tap = Gesture.Tap().onEnd(() => { runOnJS(onTap)(); });
  const composed = Gesture.Simultaneous(pan, tap);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_W, 0, SCREEN_W],
      [-20, 0, 20],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const photo   = profile.photos?.[0];
  const signals = profile.trustSignals;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.card, cardStyle]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoInitial}>{profile.name?.[0] ?? '?'}</Text>
          </View>
        )}

        {/* Swipe overlays */}
        <Animated.View style={[styles.swipeLabel, styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeLabelText}>LIKE 💜</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeLabel, styles.passLabel, passOpacity]}>
          <Text style={styles.passLabelText}>PASS ✕</Text>
        </Animated.View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ REZ</Text>
              </View>
            )}
          </View>
          <Text style={styles.city}>📍 {profile.city}</Text>
          {profile.bio ? <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text> : null}

          {/* Trust badges — powered by computed trustSignals */}
          {signals && (
            <View style={styles.trustRow}>
              {signals.trustLevel !== 'UNVERIFIED' && (
                <View style={[styles.trustBadge, DISCOVER_BADGE_COLORS[signals.trustLevel] ?? '#e0e7ff']}>
                  <Text style={[styles.trustBadgeText, { color: '#3730a3' }]}>
                    ★ {signals.trustLevelLabel}
                  </Text>
                </View>
              )}
              {signals.responsePercent >= 50 && (
                <View style={[styles.trustBadge, styles.trustBadgeGreen]}>
                  <Text style={[styles.trustBadgeText, styles.trustBadgeTextGreen]}>
                    ⚡ {signals.responsePercent}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DiscoverScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['discover'],
    queryFn: () => discoverAPI.getFeed().then((r) => r.data as Profile[]),
  });

  const likeMutation = useMutation({
    mutationFn: (profileId: string) => matchAPI.like(profileId),
    onSuccess: (data, profileId) => {
      if (data.data.matched) {
        // RZ-M-F3 FIX: Read from query cache instead of the stale `feed` closure.
        // The `feed` variable is captured at render time; if the feed refreshed between
        // the user liking and the mutation completing, matchedProfile would be null and
        // the match modal shows no avatar despite a successful match.
        const profile = queryClient.getQueryData<Profile[]>(['discover'])
          ?.find((p) => p.id === profileId) ?? null;
        setMatchedProfile(profile);
        setShowMatchModal(true);
      }
    },
  });

  const handleLike = (profile: Profile) => {
    likeMutation.mutate(profile.id);
    setCurrentIndex((i) => i + 1);
  };

  const handlePass = () => setCurrentIndex((i) => i + 1);

  const handleSendMessage = () => {
    setShowMatchModal(false);
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    navigation.navigate('Matches');
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  const current = (feed as Profile[])[currentIndex];
  const next = (feed as Profile[])[currentIndex + 1];

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>✨</Text>
        <Text style={styles.emptyText}>You've seen everyone nearby</Text>
        <Text style={styles.emptySubtext}>New profiles drop daily. Check back tomorrow!</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => {
          queryClient.invalidateQueries({ queryKey: ['discover'] });
          setCurrentIndex(0);
        }}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <GestureHandlerRootView style={styles.container}>
        {/* Next card (behind) */}
        {next && (
          <View style={[styles.card, styles.nextCard]}>
            <View style={next.photos?.[0] ? {} : styles.photoPlaceholder}>
              {next.photos?.[0]
                ? <Image source={{ uri: next.photos[0] }} style={styles.photo} resizeMode="cover" />
                : <Text style={styles.photoInitial}>{next.name?.[0] ?? '?'}</Text>
              }
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{next.name}, {next.age}</Text>
            </View>
          </View>
        )}

        <SwipeCard
          key={current.id}
          profile={current}
          onLike={() => handleLike(current)}
          onPass={handlePass}
          onTap={() => navigation.navigate('ProfileDetail', { profileId: current.id })}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.passBtn]} onPress={handlePass}>
            <Text style={styles.passBtnText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.likeBtn]}
            onPress={() => handleLike(current)}
          >
            <Text style={styles.likeBtnText}>♥</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Swipe right to like · Tap to view profile</Text>
      </GestureHandlerRootView>

      <MatchModal
        visible={showMatchModal}
        matchedProfile={matchedProfile}
        onSendMessage={handleSendMessage}
        onKeepSwiping={() => setShowMatchModal(false)}
      />
    </>
  );
}

// ─── Trust Badge Colors ─────────────────────────────────────────────────────────
const DISCOVER_BADGE_COLORS: Record<string, string> = {
  VERIFIED: '#e0e7ff',
  BRONZE:   '#fef3c7',
  SILVER:   '#e5e7eb',
  GOLD:     '#fef9c3',
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ff', alignItems: 'center', paddingTop: 12 },

  card: {
    width: SCREEN_W - 32,
    height: CARD_H,
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    position: 'absolute',
  },
  nextCard: { top: 16, transform: [{ scale: 0.96 }], zIndex: 0 },
  photo: { width: '100%', height: CARD_H * 0.65 },
  photoPlaceholder: { height: CARD_H * 0.65, backgroundColor: '#e8d5f5', justifyContent: 'center', alignItems: 'center' },
  photoInitial: { fontSize: 72, color: '#7c3aed' },

  swipeLabel: {
    position: 'absolute', top: 40, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 3, borderRadius: 8,
  },
  likeLabel: { left: 20, borderColor: '#7c3aed', transform: [{ rotate: '-15deg' }] },
  passLabel: { right: 20, borderColor: '#ef4444', transform: [{ rotate: '15deg' }] },
  likeLabelText: { color: '#7c3aed', fontWeight: '900', fontSize: 24 },
  passLabelText: { color: '#ef4444', fontWeight: '900', fontSize: 24 },

  info: { padding: 14, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  verifiedBadge: { backgroundColor: '#f3e8ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  verifiedText: { color: '#7c3aed', fontSize: 11, fontWeight: '700' },
  city: { color: '#888', marginTop: 4, fontSize: 13 },
  bio: { marginTop: 6, color: '#555', lineHeight: 20, fontSize: 14 },

  trustRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  trustBadge: { backgroundColor: '#f0e6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  trustBadgeText: { fontSize: 11, color: '#7c3aed', fontWeight: '700' },
  trustBadgeGreen: { backgroundColor: '#d1fae5' },
  trustBadgeTextGreen: { color: '#059669' },

  actions: {
    flexDirection: 'row', justifyContent: 'center', gap: 40,
    marginTop: CARD_H + 28, paddingVertical: 16,
  },
  btn: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  passBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#f0e6ff' },
  likeBtn: { backgroundColor: '#7c3aed' },
  passBtnText: { fontSize: 22, color: '#999' },
  likeBtnText: { fontSize: 22, color: '#fff' },
  hint: { color: '#ccc', fontSize: 11, marginTop: 4 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center' },
  emptySubtext: { marginTop: 8, color: '#999', textAlign: 'center', lineHeight: 22 },
  refreshBtn: { marginTop: 20, backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  refreshText: { color: '#fff', fontWeight: '700' },
});

const matchStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,0,50,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bgHeart1: { position: 'absolute', top: '15%', left: '10%', fontSize: 48, opacity: 0.15 },
  bgHeart2: { position: 'absolute', top: '25%', right: '8%', fontSize: 64, opacity: 0.1 },
  matchTitle: {
    fontSize: 36, fontWeight: '900', color: '#fff',
    textAlign: 'center', marginBottom: 8,
    textShadowColor: '#7c3aed', textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 },
  },
  matchSub: { fontSize: 16, color: '#d8b4fe', marginBottom: 40, textAlign: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 48 },
  avatarWrap: { alignItems: 'center' },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 94, height: 94, borderRadius: 47 },
  avatarPlaceholder: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#4c1d95', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32, color: '#e9d5ff', fontWeight: '700' },
  avatarName: { color: '#d8b4fe', marginTop: 6, fontSize: 13, fontWeight: '600' },
  heartIcon: { fontSize: 32 },
  msgBtn: {
    backgroundColor: '#7c3aed', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 48,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  msgBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  keepBtn: {
    borderWidth: 1.5, borderColor: '#6d28d9', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 48,
    width: '100%', alignItems: 'center',
  },
  keepBtnText: { color: '#c4b5fd', fontSize: 15, fontWeight: '600' },
});
