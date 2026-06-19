/**
 * RequestInboxScreen — message request queue
 *
 * Shows pending chat requests with the sender's preview text.
 * Receiver can Accept (opens chat) or Decline.
 */

import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestAPI } from '../services/api';

interface Request {
  id: string;
  matchId: string;
  previewText: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    age: number;
    photos: string[];
    city: string;
    isVerified: boolean;
    bio?: string;
  };
}

export default function RequestInboxScreen({
  navigation,
}: {
  navigation: { navigate: (s: string, p?: object) => void };
}) {
  const qc = useQueryClient();

  const { data: requests, isLoading, refetch, isRefetching } = useQuery<Request[]>({
    queryKey: ['message-requests'],
    queryFn: () => requestAPI.getInbox().then((r) => r.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => requestAPI.accept(requestId),
    onSuccess: (_, requestId) => {
      qc.invalidateQueries({ queryKey: ['message-requests'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
      const req = requests?.find((r) => r.id === requestId);
      if (req) {
        navigation.navigate('Chat', { matchId: req.matchId, matchName: req.sender.name });
      }
    },
    onError: () => Alert.alert('Error', 'Could not accept request. Try again.'),
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => requestAPI.decline(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message-requests'] }),
    onError: () => Alert.alert('Error', 'Could not decline request.'),
  });

  const handleDecline = (requestId: string, senderName: string) => {
    Alert.alert(
      'Decline request?',
      `${senderName}'s message request will be declined.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => declineMutation.mutate(requestId) },
      ],
    );
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7c3aed" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: item.sender.photos[0] || 'https://ui-avatars.com/api/?size=80' }}
                style={styles.avatar}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.sender.name}, {item.sender.age}</Text>
                  {item.sender.isVerified && <Text style={styles.verified}>✓ Verified</Text>}
                </View>
                <Text style={styles.city}>{item.sender.city}</Text>
                <Text style={styles.timeAgo}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>

            {item.sender.bio && (
              <Text style={styles.bio} numberOfLines={2}>{item.sender.bio}</Text>
            )}

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Their message</Text>
              <Text style={styles.previewText}>"{item.previewText}"</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.declineBtn, declineMutation.isPending && { opacity: 0.5 }]}
                onPress={() => handleDecline(item.id, item.sender.name)}
                disabled={declineMutation.isPending || acceptMutation.isPending}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptBtn, acceptMutation.isPending && { opacity: 0.5 }]}
                onPress={() => acceptMutation.mutate(item.id)}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                {acceptMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.acceptBtnText}>Accept & Chat</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💌</Text>
            <Text style={styles.emptyTitle}>No pending requests</Text>
            <Text style={styles.emptySub}>
              When someone sends you a message request, it'll appear here for your review.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fafafa' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:         { padding: 16, gap: 14 },

  card:         {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0e6ff' },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:         { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  verified:     { fontSize: 11, color: '#7c3aed', fontWeight: '700', backgroundColor: '#f0e6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  city:         { fontSize: 12, color: '#888', marginTop: 2 },
  timeAgo:      { fontSize: 11, color: '#bbb', marginTop: 1 },
  bio:          { fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 10 },

  previewBox:   { backgroundColor: '#faf5ff', borderRadius: 12, padding: 12, marginBottom: 14 },
  previewLabel: { fontSize: 10, fontWeight: '700', color: '#7c3aed', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewText:  { fontSize: 14, color: '#333', fontStyle: 'italic', lineHeight: 20 },

  actions:      { flexDirection: 'row', gap: 10 },
  declineBtn:   { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e9d5ff' },
  declineBtnText: { color: '#9ca3af', fontWeight: '700', fontSize: 14 },
  acceptBtn:    { flex: 2, backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty:        { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptySub:     { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
});
