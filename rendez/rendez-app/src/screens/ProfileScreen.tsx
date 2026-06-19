import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Share, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { profileAPI, referralAPI } from '../services/api';

const INTENT_LABEL: Record<string, string> = { DATING: '💘 Dating', FRIENDSHIP: '🤝 Friendship', NETWORKING: '💼 Networking' };
const GENDER_LABEL: Record<string, string> = { MALE: 'Man', FEMALE: 'Woman', NON_BINARY: 'Non-binary' };

interface Profile {
  name: string; age: number; gender: string; interestedIn: string[];
  intent: string; city: string; bio?: string; photos: string[];
  isVerified: boolean; profileScore: number;
  meetupCount?: number; referralCount?: number;
}

export default function ProfileScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile-me'],
    queryFn: () => profileAPI.getMe().then((r) => r.data),
  });

  const handleShareInvite = async () => {
    try {
      const res = await referralAPI.getMyCode();
      const { link, referralCount } = res.data as { link: string; referralCount: number };
      await Share.share({
        message: `Join me on Rendez — real social meetups, real connections 💜\n\nUse my invite link: ${link}`,
        url: link,
      });
    } catch {
      Alert.alert('Error', 'Could not generate your invite link');
    }
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;
  if (!profile) return null;

  const p = profile;
  const mainPhoto = p.photos?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        {mainPhoto ? (
          <Image source={{ uri: mainPhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{p.name?.[0] || '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{p.name}, {p.age}</Text>
        {p.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ REZ Verified</Text>
          </View>
        )}

        {/* Score bar */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Profile strength</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreFill, { width: `${p.profileScore}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{Math.round(p.profileScore)}%</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        {[
          { icon: '📍', text: p.city },
          { icon: '👤', text: GENDER_LABEL[p.gender] },
          { icon: '❤️', text: `Interested in ${p.interestedIn.map((g) => GENDER_LABEL[g]).join(', ')}` },
          { icon: '🎯', text: INTENT_LABEL[p.intent] || p.intent },
        ].map(({ icon, text }) => (
          <View key={icon} style={styles.detailRow}>
            <Text style={styles.detailIcon}>{icon}</Text>
            <Text style={styles.detailText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About me</Text>
        <Text style={styles.bioText}>{p.bio || 'No bio yet — add one in Edit Profile!'}</Text>
      </View>

      {/* Photos preview */}
      {(p.photos?.length ?? 0) > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos ({p.photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            <View style={styles.photoStrip}>
              {p.photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Trust stats */}
      {((profile.meetupCount ?? 0) > 0 || (profile.referralCount ?? 0) > 0) && (
        <View style={[styles.section, { flexDirection: 'row', gap: 12 }]}>
          {(profile.meetupCount ?? 0) > 0 && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.meetupCount}</Text>
              <Text style={styles.statLabel}>Real meetup{(profile.meetupCount ?? 0) > 1 ? 's' : ''}</Text>
            </View>
          )}
          {(profile.referralCount ?? 0) > 0 && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.referralCount}</Text>
              <Text style={styles.statLabel}>Friends invited</Text>
            </View>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ProfileEdit')}>
          <Text style={styles.editBtnText}>✏️  Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inviteBtn} onPress={handleShareInvite}>
          <Text style={styles.inviteBtnText}>💜  Invite Friends — Earn Coins</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rewardBtn} onPress={() => navigation.navigate('ExperienceWallet')}>
          <Text style={styles.rewardBtnText}>✨  Experience Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsBtnText}>⚙️  Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#faf5ff', paddingHorizontal: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#e9d5ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40, color: '#7c3aed', fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  verifiedBadge: { marginTop: 6, backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3 },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  scoreLabel: { fontSize: 12, color: '#999' },
  scoreBar: { width: 100, height: 6, borderRadius: 3, backgroundColor: '#e9d5ff', overflow: 'hidden' },
  scoreFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 3 },
  scoreValue: { fontSize: 12, color: '#7c3aed', fontWeight: '700' },
  section: { padding: 20, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  detailIcon: { fontSize: 18, width: 24 },
  detailText: { fontSize: 15, color: '#333', flex: 1 },
  bioText: { fontSize: 15, color: '#444', lineHeight: 22 },
  photoStrip: { flexDirection: 'row', gap: 8 },
  photoThumb: { width: 90, height: 110, borderRadius: 10 },
  statCard:    { flex: 1, backgroundColor: '#faf5ff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue:   { fontSize: 22, fontWeight: '800', color: '#7c3aed' },
  statLabel:   { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },
  actions: { padding: 20, gap: 10 },
  editBtn: {
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  inviteBtn: {
    backgroundColor: '#fdf4ff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e9d5ff',
    paddingVertical: 14, alignItems: 'center',
  },
  inviteBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 15 },
  rewardBtn: {
    backgroundColor: '#fffbeb', borderRadius: 14, borderWidth: 1.5, borderColor: '#fcd34d',
    paddingVertical: 14, alignItems: 'center',
  },
  rewardBtnText: { color: '#d97706', fontWeight: '700', fontSize: 15 },
  settingsBtn: {
    borderWidth: 1.5, borderColor: '#e9d5ff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  settingsBtnText: { color: '#555', fontWeight: '600', fontSize: 15 },
});
