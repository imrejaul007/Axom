import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Animated, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { genieService } from '../../src/services/genieService';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  userBubble: '#6366F1',
  genieBubble: '#252540',
};

interface Message {
  id: string;
  role: 'user' | 'genie';
  text: string;
  intent?: string;
  confidence?: number;
  action?: any;
  timestamp: Date;
}

export default function GenieAssistant({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Welcome message
      if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'genie',
          text: "Hey! I'm Genie 👋\n\nI can help you with:\n• Adding visitors to your society\n• Finding homes to rent\n• Checking your rent credit score\n• Safety alerts and SOS\n\nWhat would you like to do?",
          timestamp: new Date()
        }]);
      }
    }
  }, [visible]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    scrollRef.current?.scrollToEnd({ animated: true });

    try {
      // Process through Genie
      const result = await genieService.processMessage(userMessage.text);

      const genieResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'genie',
        text: result.response || "I'm not sure I understand.",
        intent: result.intent,
        confidence: result.confidence,
        action: result.action,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, genieResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'genie',
        text: "Sorry, I couldn't process that. Try again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    }

    setLoading(false);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleAction = (action: any) => {
    if (action?.type === 'navigate' && action?.screen) {
      onClose();
      // Navigate to the screen
      setTimeout(() => {
        router.push(`/${action.screen}`);
      }, 300);
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const suggestions = genieService.getSuggestions('default');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.genieAvatar}>
                <Ionicons name="sparkles" size={24} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Genie</Text>
                <Text style={styles.headerSubtitle}>Your AI assistant</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  msg.role === 'user' ? styles.userRow : styles.genieRow
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.role === 'user' ? styles.userBubble : styles.genieBubble
                  ]}
                >
                  {msg.role === 'genie' && (
                    <View style={styles.genieHeader}>
                      <Ionicons name="sparkles" size={14} color={colors.accent} />
                      <Text style={styles.genieLabel}>Genie</Text>
                    </View>
                  )}
                  <Text style={styles.messageText}>{msg.text}</Text>

                  {msg.action && msg.role === 'genie' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleAction(msg.action)}
                    >
                      <Ionicons name="arrow-forward-circle" size={16} color={colors.primary} />
                      <Text style={styles.actionBtnText}>Take me there</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageRow, styles.genieRow]}>
                <View style={[styles.bubble, styles.genieBubble]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Suggestions */}
          {!input && messages.length <= 2 && (
            <View style={styles.suggestions}>
              {suggestions.slice(0, 4).map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask Genie anything..."
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim()}
              >
                <Ionicons name="send" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    maxHeight: 700,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  genieAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginLeft: 12 },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, marginLeft: 12 },
  closeBtn: { padding: 8 },
  messages: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 10 },
  messageRow: { marginBottom: 12 },
  userRow: { alignItems: 'flex-end' },
  genieRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { backgroundColor: colors.userBubble, borderBottomRightRadius: 4 },
  genieBubble: { backgroundColor: colors.genieBubble, borderBottomLeftRadius: 4 },
  genieHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  genieLabel: { fontSize: 11, color: colors.accent, marginLeft: 6, fontWeight: '600' },
  messageText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  actionBtnText: { fontSize: 13, color: colors.primary, marginLeft: 6, fontWeight: '600' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted, marginHorizontal: 2 },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: { fontSize: 13, color: colors.textSecondary },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceLight },
});
