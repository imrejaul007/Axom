/**
 * Ask Chat - Conversation with Ask Buzz AI assistant (Premium UI)
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
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; type: string }[];
  timestamp: Date;
}

const MOCK_CONVERSATION: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hi! I'm Buzz, your local AI assistant. I can help you find restaurants, services, safety info, and more about your neighborhood. What would you like to know?",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    role: 'user',
    content: 'Best biryani places near Koramangala?',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Here are the top-rated biryani spots in Koramangala:\n\n1. **Meghana Foods** - Famous for their Hyderabadi biryani, ~₹350 for full plate\n2. **Empire Restaurant** - Known for chicken biryani, great reviews\n3. **Truffles** - American burger place with biryani too\n4. **Biryani Zone** - Local favorite with quick delivery\n\nWould you like me to show them on a map or help you order?',
    sources: [
      { title: 'Meghana Foods', type: 'restaurant' },
      { title: 'Empire Restaurant', type: 'restaurant' },
    ],
    timestamp: new Date(Date.now() - 3400000),
  },
];

const QUICK_ACTIONS = [
  { label: 'Restaurants', icon: 'restaurant', query: 'Nearby restaurants' },
  { label: 'Safety', icon: 'shield', query: 'Safety tips for my area' },
  { label: 'Events', icon: 'calendar', query: 'Events this weekend' },
];

export default function AskChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const sendAnim = useRef(new Animated.Value(1)).current;
  const typingDots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);

    // Animate typing dots
    typingDots.forEach((dot, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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

  const handleSend = async () => {
    if (!inputText.trim()) return;

    animateSend();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const responses = [
        "That's a great question! Let me find the best information for you.",
        "I found some helpful results. Here you go!",
        "Based on your location, here's what I recommend.",
      ];
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)] || 'Here are my thoughts on that.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const handleQuickAction = (query: string) => {
    setInputText(query);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <Animated.View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.avatarGradient}>
              <Ionicons name="bulb" size={18} color="#fff" />
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
          ]}
        >
          {isUser ? (
            <>
              <Text style={styles.messageTextUser}>{item.content}</Text>
              <Text style={styles.messageTimeUser}>{formatTime(item.timestamp)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.messageTextAssistant}>{item.content}</Text>
              {item.sources && item.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <View style={styles.sourcesHeader}>
                    <Ionicons name="link" size={12} color={COLORS.primary} />
                    <Text style={styles.sourcesTitle}>Related:</Text>
                  </View>
                  <View style={styles.sourcesList}>
                    {item.sources.map((source, index) => (
                      <TouchableOpacity key={index} style={styles.sourceChip}>
                        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.sourceGradient}>
                          <Ionicons
                            name={source.type === 'restaurant' ? 'restaurant' : 'location'}
                            size={12} color="#fff"
                          />
                          <Text style={styles.sourceText}>{source.title}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <Text style={styles.messageTimeAssistant}>{formatTime(item.timestamp)}</Text>
            </>
          )}
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.avatarGradient}>
              <Ionicons name="person" size={14} color="#fff" />
            </LinearGradient>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.avatarGradient}>
              <Ionicons name="bulb" size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.headerTitle}>Ask Buzz</Text>
            <Text style={styles.headerSubtitle}>Local AI Assistant</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/ask/history')}
        >
          <Ionicons name="time" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
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
            <View style={styles.assistantAvatarSmall}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.avatarGradientSmall}>
                <Ionicons name="bulb" size={14} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                {typingDots.map((dot, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.typingDot,
                      {
                        opacity: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                        transform: [{
                          scale: dot.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          }),
                        }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => handleQuickAction(action.query)}
            >
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.quickActionGradient}>
                <Ionicons name={action.icon as any} size={14} color="#fff" />
              </LinearGradient>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="image" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask about anything local..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Animated.View style={{ transform: [{ scale: sendAnim }] }}>
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#6366F1', '#8B5CF6'] : [COLORS.border, COLORS.border]}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  assistantAvatar: {
    marginRight: SPACING.xs,
  },
  assistantAvatarSmall: {
    marginRight: SPACING.xs,
  },
  avatarGradientSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  messageBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
  },
  userAvatar: {
    marginLeft: SPACING.xs,
  },
  messageTextUser: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    color: '#fff',
  },
  messageTextAssistant: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    color: COLORS.text,
  },
  sourcesContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  sourcesTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sourcesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  sourceChip: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  sourceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 4,
  },
  sourceText: {
    fontSize: FONT_SIZE.xs,
    color: '#fff',
  },
  messageTimeUser: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 4,
  },
  messageTimeAssistant: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  typingBubble: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomLeftRadius: 4,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  quickActionGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '500',
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
