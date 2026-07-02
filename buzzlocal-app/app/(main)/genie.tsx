import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { Stack } from 'expo-router';
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

export default function GenieScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'genie',
      text: "Hey! I'm Genie 👋\n\nYour AI assistant for BuzzLocal. I can help you with:\n\n🏠 Society — Add visitors, QR passes\n🏢 Housing — Find homes, check zero deposit\n🛡️ Safety — SOS, area checks\n\nWhat would you like to do?",
      timestamp: new Date()
    }]);
  }, []);

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
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'genie',
        text: "Sorry, I couldn't process that. Try again?",
        timestamp: new Date()
      }]);
    }

    setLoading(false);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const suggestions = genieService.getSuggestions('default');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Genie', headerShown: false }} />

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

              {msg.intent && (
                <View style={styles.intentBadge}>
                  <Text style={styles.intentText}>
                    {msg.intent.split('.')[0]} • {Math.round((msg.confidence || 0) * 100)}%
                  </Text>
                </View>
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
      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          {suggestions.map((text, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionChip}
              onPress={() => setInput(text)}
            >
              <Text style={styles.suggestionText}>{text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInput('Add a visitor for tomorrow')}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Add Visitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInput('Find a 2BHK in Indiranagar under 30K')}>
          <Ionicons name="home" size={20} color={colors.accentGreen} />
          <Text style={styles.quickActionText}>Find Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInput('Check my rent credit score')}>
          <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
          <Text style={styles.quickActionText}>Credit Score</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  genieAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginLeft: 12 },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginLeft: 12 },
  messages: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 10 },
  messageRow: { marginBottom: 12 },
  userRow: { alignItems: 'flex-end' },
  genieRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '88%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  genieBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  genieHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  genieLabel: { fontSize: 11, color: colors.accent, marginLeft: 6, fontWeight: '600' },
  messageText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  intentBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  intentText: { fontSize: 10, color: colors.textMuted },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted, marginHorizontal: 2 },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 8 },
  suggestionChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: { fontSize: 13, color: colors.textSecondary },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickActionText: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
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
