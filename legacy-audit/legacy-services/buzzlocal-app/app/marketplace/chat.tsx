/**
 * Marketplace Chat - Direct messaging between buyers and sellers (Premium UI)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
  read: boolean;
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', text: 'Hi! Is this still available?', sender: 'them', timestamp: new Date(Date.now() - 3600000), read: true },
  { id: '2', text: 'Yes, it is! Are you interested?', sender: 'me', timestamp: new Date(Date.now() - 3500000), read: true },
  { id: '3', text: 'Great! Can I see more photos?', sender: 'them', timestamp: new Date(Date.now() - 3400000), read: true },
  { id: '4', text: 'Sure, give me a moment.', sender: 'me', timestamp: new Date(Date.now() - 3300000), read: true },
  { id: '5', text: 'Here are some additional photos!', sender: 'me', timestamp: new Date(Date.now() - 3200000), read: true },
  { id: '6', text: 'Perfect! When can I pick it up?', sender: 'them', timestamp: new Date(Date.now() - 600000), read: true },
];

const MOCK_LISTING = {
  id: '123',
  title: 'iPhone 14 Pro - Excellent Condition',
  price: '₹65,000',
  seller: {
    name: 'Rahul S.',
    rating: 4.8,
    verified: true,
  },
};

export default function MarketplaceChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const sendAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const animateSend = () => {
    Animated.sequence([
      Animated.timing(sendAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(sendAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;

    animateSend();

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'me',
      timestamp: new Date(),
      read: false,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => setIsTyping(true), 1000);
    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message! Let me check and get back to you.',
        sender: 'them',
        timestamp: new Date(),
        read: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, 3000);
  };

  const handleMakeOffer = () => {
    // Navigate to offer flow
  };

  const handleViewListing = () => {
    router.push(`/marketplace/${params.listingId || MOCK_LISTING.id}`);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender === 'me';
    const showDate =
      index === 0 ||
      formatDate(messages[index - 1]?.timestamp) !== formatDate(item.timestamp);

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <Animated.View
          style={[
            styles.messageRow,
            isMe && styles.messageRowMe,
            { transform: [{ scale: sendAnim }] },
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
            ]}
          >
            {isMe ? (
              <>
                <Text style={styles.messageText}>{item.text}</Text>
                <View style={styles.messageFooter}>
                  <Text style={styles.messageTimeMe}>{formatTime(item.timestamp)}</Text>
                  <Ionicons
                    name={item.read ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.messageTextThem}>{item.text}</Text>
                <Text style={styles.messageTimeThem}>{formatTime(item.timestamp)}</Text>
              </>
            )}
          </View>
        </Animated.View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={handleViewListing}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {MOCK_LISTING.seller.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerTitle}>{MOCK_LISTING.seller.name}</Text>
              {MOCK_LISTING.seller.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {MOCK_LISTING.title}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Listing Preview */}
      <TouchableOpacity style={styles.listingPreview} onPress={handleViewListing}>
        <View style={styles.listingImage}>
          <Ionicons name="cube" size={24} color={COLORS.textSecondary} />
        </View>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {MOCK_LISTING.title}
          </Text>
          <Text style={styles.listingPrice}>{MOCK_LISTING.price}</Text>
        </View>
        <View style={styles.viewListingButton}>
          <Text style={styles.viewListingText}>View</Text>
        </View>
      </TouchableOpacity>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleMakeOffer}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.quickActionGradient}>
              <Ionicons name="pricetag" size={16} color="#fff" />
              <Text style={styles.quickActionText}>Make Offer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="camera" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <Animated.View style={{ transform: [{ scale: sendAnim }] }}>
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim()}
            >
              <LinearGradient
                colors={newMessage.trim() ? [COLORS.primary, '#7C3AED'] : [COLORS.border, COLORS.border]}
                style={styles.sendGradient}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  listingImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  listingPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  viewListingButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  viewListingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  messageRow: {
    marginBottom: SPACING.xs,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    color: '#fff',
  },
  messageTextThem: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTimeMe: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeThem: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  typingIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  typingBubble: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  quickAction: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 6,
  },
  quickActionText: {
    fontSize: FONT_SIZE.sm,
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {},
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
