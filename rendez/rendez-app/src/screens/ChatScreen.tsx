import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { messagingAPI, giftAPI } from '../services/api';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { useAuthStore, UserProfile } from '../store/authStore';

const LOCK_CODES = ['MSG_LOCKED', 'AWAITING_REPLY'];

interface RouteParams {
  matchId: string;
  matchName: string;
  matchPartnerId?: string;  // profile ID of the other user — needed for GiftPicker
}

export default function ChatScreen({ route, navigation }: { route: { params: RouteParams }; navigation: { navigate: (s: string, p?: object) => void } }) {
  const { matchId, matchName, matchPartnerId = '' } = route.params;
  const [content, setContent] = useState('');
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [isInputTyping, setIsInputTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read profileId from authStore — avoids fragile manual JWT decode
  // R2-M5 FIX: Use the proper UserProfile type instead of unsafe inline cast.
  const { profile } = useAuthStore();
  const myProfileId = (profile as UserProfile | null)?.id ?? '';

  // Load historical messages first
  const { data: historyData, isLoading, isError } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => messagingAPI.getMessages(matchId).then((r) => r.data),
  });

  const initialMessages = historyData?.messages || [];
  const chatState: string = historyData?.state || 'MATCHED';
  const isLocked = ['LOCKED', 'AWAITING_REPLY', 'GIFT_PENDING', 'FREE_MSG_SENT'].includes(chatState);

  // Real-time layer on top of history
  const { messages, sendMessage, isTyping, setTyping, markRead, connected } = useRealtimeChat(matchId, initialMessages);

  // Gift catalog for locked state
  const { data: catalogData } = useQuery({
    queryKey: ['gift-catalog'],
    queryFn: () => giftAPI.getCatalog().then((r) => r.data),
    enabled: showGiftPicker,
  });

  // H-8 FIX: Clear the typing debounce timer on unmount to prevent setState calls
  // on an unmounted component and to stop stop_typing being emitted after navigation.
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, []);

  // Auto-scroll to bottom on new messages
  // R2-H8 FIX: Track and clear the scroll timer to prevent memory leaks.
  useEffect(() => {
    if (messages.length > 0) {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    return () => { if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current); };
  }, [messages.length]);

  // Mark last unread message as read
  // R2-H9 FIX: Debounce markRead calls so rapid message arrival does not flood the API.
  useEffect(() => {
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => {
      const lastUnread = [...messages].reverse().find((m) => !m.read && m.senderId !== myProfileId);
      if (lastUnread) markRead(lastUnread.id);
    }, 500);
  }, [messages]);

  const handleSend = () => {
    const text = content.trim();
    if (!text) return;
    setContent('');
    setTyping(false);

    try {
      sendMessage(text);
    } catch {
      Alert.alert('Error', 'Could not send message. Check your connection.');
    }
  };

  const handleChangeText = (text: string) => {
    setContent(text);
    if (!isInputTyping) {
      setIsInputTyping(true);
      setTyping(true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsInputTyping(false);
      setTyping(false);
    }, 2000);
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;
  if (isError) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>Could not load messages.{'\n'}Check your connection and try again.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Connection status */}
      {!connected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Reconnecting...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          const isMine = item.senderId === myProfileId;
          return (
            <View style={[styles.bubbleWrap, isMine ? styles.myWrap : styles.theirWrap]}>
              <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>{item.content}</Text>
              </View>
              {isMine && (
                <Text style={styles.readReceipt}>{item.read ? '✓✓' : '✓'}</Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, gap: 6 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{matchName} is typing</Text>
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => <View key={i} style={styles.dot} />)}
          </View>
        </View>
      )}

      {/* Gift picker inline */}
      {showGiftPicker && (
        <View style={styles.giftPicker}>
          <Text style={styles.giftTitle}>Send a gift to unlock the conversation</Text>
          {(catalogData || []).slice(0, 3).map((item: { id: string; name: string; amount_paise: number; merchant_name: string }) => (
            <TouchableOpacity
              key={item.id}
              style={styles.giftItem}
              onPress={() => {
                setShowGiftPicker(false);
                navigation.navigate('GiftPicker', { matchId, receiverName: matchName, receiverId: matchPartnerId });
              }}
            >
              <Text style={styles.giftName}>{item.name}</Text>
              <Text style={styles.giftMerchant}>{item.merchant_name}</Text>
              <Text style={styles.giftPrice}>₹{item.amount_paise / 100}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.giftPickerAll}
            onPress={() => {
              setShowGiftPicker(false);
              navigation.navigate('GiftPicker', { matchId, receiverName: matchName, receiverId: matchPartnerId });
            }}
          >
            <Text style={styles.giftPickerAllText}>See all gifts →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowGiftPicker(false)} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Not now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Locked bar */}
      {isLocked && !showGiftPicker && chatState === 'FREE_MSG_SENT' && (
        <TouchableOpacity style={styles.lockedBar} onPress={() => setShowGiftPicker(true)}>
          <Text style={styles.lockedText}>⏳  You've sent your free message. Send a gift to continue the conversation.</Text>
        </TouchableOpacity>
      )}
      {isLocked && !showGiftPicker && chatState !== 'FREE_MSG_SENT' && (
        <TouchableOpacity style={styles.lockedBar} onPress={() => setShowGiftPicker(true)}>
          <Text style={styles.lockedText}>🎁  Send a gift to unlock conversation</Text>
        </TouchableOpacity>
      )}

      {/* Input row */}
      {!isLocked && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={handleChangeText}
            placeholder="Type a message..."
            placeholderTextColor="#bbb"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !content.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!content.trim()}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ff' },
  offlineBanner: { backgroundColor: '#f59e0b', padding: 6, alignItems: 'center' },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  bubbleWrap: { flexDirection: 'column', maxWidth: '78%', gap: 2 },
  myWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirWrap: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 15, color: '#333', lineHeight: 21 },
  myBubbleText: { color: '#fff' },
  readReceipt: { fontSize: 10, color: '#9ca3af', paddingRight: 4 },

  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  typingText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  typingDots: { flexDirection: 'row', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#c4b5fd' },

  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#ede9fe', gap: 8, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#7c3aed', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#ddd' },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  lockedBar: { padding: 16, backgroundColor: '#f9f5ff', borderTopWidth: 1, borderColor: '#e9d5ff', alignItems: 'center' },
  lockedText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },

  giftPicker: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ede9fe', padding: 16, gap: 8 },
  giftTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  giftItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderWidth: 1, borderColor: '#e9d5ff', borderRadius: 10,
  },
  giftName: { fontWeight: '600', color: '#333', flex: 1 },
  giftMerchant: { color: '#888', fontSize: 12, flex: 1 },
  giftPrice: { color: '#7c3aed', fontWeight: '700' },
  giftPickerAll: { alignItems: 'center', paddingVertical: 6 },
  giftPickerAllText: { color: '#7c3aed', fontWeight: '600', fontSize: 13 },
  dismissBtn: { alignItems: 'center', paddingVertical: 4 },
  dismissText: { color: '#bbb', fontSize: 13 },
});
