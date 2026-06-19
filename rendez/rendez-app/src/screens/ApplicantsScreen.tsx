/**
 * ApplicantsScreen — organizer views ranked applicants and selects one
 */

import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planAPI } from '../services/api';

interface Applicant {
  id: string;
  note?: string;
  score: number;
  status: string;
  applicant: {
    id: string; name: string; photos: string[];
    age: number; city: string; isVerified: boolean; bio?: string;
  };
}

export default function ApplicantsScreen({
  route, navigation,
}: {
  route: { params: { planId: string } };
  navigation: { navigate: (s: string, p?: object) => void; goBack: () => void };
}) {
  const { planId } = route.params;
  const qc = useQueryClient();

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['plan-applicants', planId],
    queryFn: () => planAPI.getApplicants(planId).then((r) => r.data as Applicant[]),
  });

  const selectMutation = useMutation({
    mutationFn: (applicantId: string) => planAPI.select(planId, applicantId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['plan-applicants', planId] });
      Alert.alert('Selected! 🎉', 'Chat is now open. Coordinate your meetup!', [
        { text: 'Open Chat', onPress: () => navigation.navigate('Chat', { matchId: res.data.matchId, matchName: 'Your match' }) },
        { text: 'OK' },
      ]);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      Alert.alert('Error', err.response?.data?.message || 'Could not select'),
  });

  const handleSelect = (applicant: Applicant) => {
    Alert.alert(
      `Select ${applicant.applicant.name}?`,
      'This will open a chat and notify them. All other applicants will be rejected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Select', onPress: () => selectMutation.mutate(applicant.applicant.id) },
      ],
    );
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#7c3aed" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {applicants?.length || 0} {applicants?.length === 1 ? 'Application' : 'Applications'} · Ranked by score
      </Text>

      <FlatList
        data={applicants || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>

            <View style={styles.applicantHeader}>
              <Image
                source={{ uri: item.applicant.photos[0] || 'https://ui-avatars.com/api/?size=80' }}
                style={styles.avatar}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.name}>{item.applicant.name}, {item.applicant.age}</Text>
                  {item.applicant.isVerified && <Text style={styles.verified}>✓</Text>}
                </View>
                <Text style={styles.city}>{item.applicant.city}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{Math.round(item.score)}</Text>
              </View>
            </View>

            {item.applicant.bio && (
              <Text style={styles.bio} numberOfLines={2}>{item.applicant.bio}</Text>
            )}

            {item.note && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Their note</Text>
                <Text style={styles.noteText}>"{item.note}"</Text>
              </View>
            )}

            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={[styles.selectBtn, selectMutation.isPending && { opacity: 0.5 }]}
                onPress={() => handleSelect(item)}
                disabled={selectMutation.isPending}
              >
                <Text style={styles.selectBtnText}>Select {item.applicant.name} →</Text>
              </TouchableOpacity>
            )}

            {item.status === 'SELECTED' && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>✓ Selected</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptySub}>Share your plan to get more visibility</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fafafa' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { fontSize: 13, fontWeight: '600', color: '#888', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0e6ff' },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  rankBadge:      { position: 'absolute', top: 12, right: 12, backgroundColor: '#faf5ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rankText:       { fontSize: 11, fontWeight: '700', color: '#7c3aed' },
  applicantHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar:         { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0e6ff' },
  name:           { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  verified:       { fontSize: 12, color: '#7c3aed', fontWeight: '800' },
  city:           { fontSize: 12, color: '#888', marginTop: 2 },
  scoreBadge:     { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText:      { color: '#fff', fontWeight: '800', fontSize: 14 },
  bio:            { fontSize: 13, color: '#555', marginBottom: 10, fontStyle: 'italic' },
  noteBox:        { backgroundColor: '#faf5ff', borderRadius: 10, padding: 10, marginBottom: 12 },
  noteLabel:      { fontSize: 10, fontWeight: '700', color: '#7c3aed', marginBottom: 4 },
  noteText:       { fontSize: 13, color: '#333', fontStyle: 'italic' },
  selectBtn:      { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  selectBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  selectedBadge:  { backgroundColor: '#d1fae5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  selectedText:   { color: '#059669', fontSize: 15, fontWeight: '700' },
  empty:          { alignItems: 'center', marginTop: 60 },
  emptyEmoji:     { fontSize: 40, marginBottom: 10 },
  emptyTitle:     { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  emptySub:       { fontSize: 13, color: '#888', marginTop: 4 },
});
