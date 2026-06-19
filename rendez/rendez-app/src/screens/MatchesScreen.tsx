import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { matchAPI, requestAPI } from '../services/api';
import { useAuthStore, UserProfile } from '../store/authStore';

type ChatState = 'MATCHED' | 'FREE_MSG_SENT' | 'AWAITING_REPLY' | 'LOCKED' | 'GIFT_PENDING' | 'OPEN';

interface LastMessage {
  preview: string;
  senderId: string;
  createdAt: string;
}

interface MatchUser {
  id: string;
  name: string;
  photos: string[];
  age: number;
  city: string;
  isVerified: boolean;
}

interface MatchItem {
  id: string;
  user1: MatchUser;
  user2: MatchUser;
  messageState: { state: ChatState; lastActivityAt: string; id: string } | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  createdAt: string;
}

const STATE_META: Record<ChatState, { label: string; color: string; icon: string }> = {
  MATCHED:        { label: 'Say hello!',     color: '#7c3aed', icon: '👋' },
  FREE_MSG_SENT:  { label: 'Waiting...',     color: '#f59e0b', icon: '⏳' },
  AWAITING_REPLY: { label: 'Your turn',      color: '#7c3aed', icon: '💬' },
  LOCKED:         { label: 'Send a gift',    color: '#ef4444', icon: '🔒' },
  GIFT_PENDING:   { label: 'Gift sent',      color: '#10b981', icon: '🎁' },
  OPEN:           { label: 'Open chat',      color: '#10b981', icon: '✓' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function MatchesScreen({ navigation }: { navigation: { navigate: (s: string, p?: object) => void } }) {
  const { token, profile } = useAuthStore();

  // H-5 FIX: Replaced raw atob JWT decode with a safe helper that:
  //   1. Guards against null token before splitting
  //   2. Uses a base64url-compatible decode (atob only handles base64, not base64url)
  //   3. Wraps in try/catch with a safe fallback
  // Prefer reading the profile id from the authStore when available to avoid
  // any JWT parsing altogether.
  // RD-L-12 FIX: Added `profile` to the useMemo dependency array so myId re-evaluates
  // when the profile is loaded after the initial token, not just when the token changes.
  const myId = useMemo(() => {
    // Primary: read from profile stored in authStore (no decode needed)
    // R2-M6 FIX: Use proper UserProfile type instead of unsafe inline casts.
    const p = profile as UserProfile | null;
    if (p?.id) {
      return p.id;
    }

    if (!token) return '';
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return '';
      // base64url → base64 conversion before decoding
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decoded = typeof atob !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
      // R2-M6 FIX: Wrap JSON.parse in try-catch to handle malformed JWT payloads safely.
      try {
        return (JSON.parse(decoded) as { sub?: string }).sub ?? '';
      } catch {
        return '';
      }
    } catch {
      return '';
    }
  }, [token, profile]);

  const { data: matches = [], isLoading, refetch } = useQuery<MatchItem[]>({
    queryKey: ['matches'],
    queryFn: () => matchAPI.getAll().then((r) => r.data),
    refetchInterval: 15000,
  });

  const { data: pendingRequests = [] } = useQuery<{ id: string }[]>({
    queryKey: ['message-requests'],
    queryFn: () => requestAPI.getInbox().then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  // R2-L9: Cap totalUnread to prevent badge overflow from corrupted/malicious server responses.
  const totalUnread = Math.min(matches.reduce((sum, m) => sum + (m.unreadCount || 0), 0), 999);

  if (matches.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>💜</Text>
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptySub}>Discover people and send likes to match</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pendingRequests.length > 0 && (
        <TouchableOpacity
          style={styles.requestBanner}
          onPress={() => navigation.navigate('RequestInbox')}
        >
          <Text style={styles.requestBannerText}>
            💌 {pendingRequests.length} message request{pendingRequests.length > 1 ? 's' : ''} waiting
          </Text>
          <Text style={styles.requestBannerArrow}>Review →</Text>
        </TouchableOpacity>
      )}

      {totalUnread > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          const other = item.user1.id === myId ? item.user2 : item.user1;
          const state = item.messageState?.state || 'MATCHED';
          const meta = STATE_META[state];
          const photo = other.photos?.[0];
          const isMine = item.lastMessage?.senderId === myId;
          const hasUnread = item.unreadCount > 0;

          const timeStr = item.lastMessage?.createdAt
            ? relativeTime(item.lastMessage.createdAt)
            : relativeTime(item.createdAt);

          return (
            <TouchableOpacity
              style={[styles.row, hasUnread && styles.rowUnread]}
              onPress={() => navigation.navigate('Chat', { matchId: item.id, matchName: other.name, matchPartnerId: other.id })}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{other.name[0]}</Text>
                  </View>
                )}
                {state === 'OPEN' && <View style={styles.onlineDot} />}
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <View style={styles.nameWrap}>
                    <Text style={[styles.name, hasUnread && styles.nameUnread]}>
                      {other.name}
                    </Text>
                    {other.isVerified && (
                      <Text style={styles.verifiedBadge}>✓</Text>
                    )}
                  </View>
                  <Text style={[styles.time, hasUnread && styles.timeUnread]}>{timeStr}</Text>
                </View>

                <View style={styles.previewRow}>
                  {item.lastMessage ? (
                    <Text
                      style={[styles.preview, hasUnread && styles.previewUnread]}
                      numberOfLines={1}
                    >
                      {isMine ? 'You: ' : ''}{item.lastMessage.preview}
                    </Text>
                  ) : (
                    <Text style={styles.previewHint}>
                      {meta.icon} {meta.label}
                    </Text>
                  )}

                  {hasUnread ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </Text>
                    </View>
                  ) : state === 'LOCKED' ? (
                    <View style={styles.lockedChip}>
                      <Text style={styles.lockedChipText}>🔒</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  requestBanner: {
    backgroundColor: '#f0e6ff', paddingVertical: 12, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#e9d5ff',
  },
  requestBannerText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  requestBannerArrow: { color: '#7c3aed', fontSize: 13, fontWeight: '700' },

  unreadBanner: {
    backgroundColor: '#7c3aed', paddingVertical: 8, paddingHorizontal: 20,
  },
  unreadBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
    backgroundColor: '#fff',
  },
  rowUnread: { backgroundColor: '#faf5ff' },

  avatarWrap: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 22, color: '#7c3aed', fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff',
  },

  content: { flex: 1, gap: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 16, color: '#1a1a2e', fontWeight: '500' },
  nameUnread: { fontWeight: '700' },
  verifiedBadge: { fontSize: 11, color: '#7c3aed', fontWeight: '700' },
  time: { fontSize: 12, color: '#bbb' },
  timeUnread: { color: '#7c3aed', fontWeight: '600' },

  previewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { fontSize: 13, color: '#999', flex: 1, marginRight: 8 },
  previewUnread: { color: '#1a1a2e', fontWeight: '500' },
  previewHint: { fontSize: 13, color: '#c4b5fd', flex: 1 },

  badge: {
    backgroundColor: '#7c3aed', borderRadius: 10, minWidth: 20,
    height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  lockedChip: {
    backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  lockedChipText: { fontSize: 12 },

  separator: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 86 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 32 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center' },
});
