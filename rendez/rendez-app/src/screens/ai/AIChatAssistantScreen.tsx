/**
 * AI Chat Assistant Screen
 * Genie-powered suggestions for conversations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiMatchmakingService } from '../../services/ai/matchmaking';

const COLORS = {
  primary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#0f0f23',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

interface Suggestion {
  id: string;
  type: 'reply' | 'ice_breaker' | 'date_idea' | 'gift_idea' | 'reminder';
  content: string;
  icon: string;
  category: string;
}

export default function AIChatAssistantScreen() {
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const insights = await aiMatchmakingService.getConversationInsights('user1', 'match1');

    const allSuggestions: Suggestion[] = [
      ...insights.responseSuggestions.map((s, i) => ({
        id: `reply-${i}`,
        type: 'reply' as const,
        content: s,
        icon: 'chatbubble-ellipses',
        category: 'Replies',
      })),
      ...insights.iceBreakers.map((s, i) => ({
        id: `ice-${i}`,
        type: 'ice_breaker' as const,
        content: s,
        icon: 'bulb',
        category: 'Ice Breakers',
      })),
      ...insights.dateIdeas.slice(0, 3).map((d, i) => ({
        id: `date-${i}`,
        type: 'date_idea' as const,
        content: `${d.title} - ${d.reason}`,
        icon: 'calendar',
        category: 'Date Ideas',
      })),
      {
        id: 'reminder-1',
        type: 'reminder' as const,
        content: "Partner's birthday in 5 days - Consider a gift!",
        icon: 'gift',
        category: 'Reminders',
      },
      {
        id: 'reminder-2',
        type: 'reminder' as const,
        content: "You haven't video called in 3 days",
        icon: 'videocam',
        category: 'Reminders',
      },
    ];

    setSuggestions(allSuggestions);
  };

  const categories = ['all', 'Replies', 'Ice Breakers', 'Date Ideas', 'Reminders'];

  const filteredSuggestions = selectedCategory === 'all'
    ? suggestions
    : suggestions.filter(s => s.category === selectedCategory);

  const handleUseSuggestion = (suggestion: Suggestion) => {
    // In real app, this would copy to clipboard or insert into chat
    console.log('Using suggestion:', suggestion.content);
  };

  const getIconColor = (type: string) => {
    const colors: Record<string, string> = {
      reply: COLORS.primary,
      ice_breaker: COLORS.warning,
      date_idea: COLORS.success,
      gift_idea: '#ec4899',
      reminder: COLORS.accent,
    };
    return colors[type] || COLORS.primary;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.genieIcon}>
            <Text style={styles.genieEmoji}>🧞</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Genie Assistant</Text>
            <Text style={styles.headerSubtitle}>AI-powered conversation help</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categories}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === cat && styles.categoryTextActive,
            ]}>
              {cat === 'all' ? '✨ All' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Suggestions List */}
      <FlatList
        data={filteredSuggestions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.suggestionsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionCard}
            onPress={() => handleUseSuggestion(item)}
          >
            <View style={[styles.suggestionIcon, { backgroundColor: getIconColor(item.type) + '20' }]}>
              <Ionicons name={item.icon as any} size={20} color={getIconColor(item.type)} />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionText}>{item.content}</Text>
              <Text style={styles.suggestionCategory}>{item.category}</Text>
            </View>
            <TouchableOpacity style={styles.useButton}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Suggestions' : selectedCategory}
            </Text>
            <Text style={styles.sectionCount}>{filteredSuggestions.length} suggestions</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No suggestions available</Text>
          </View>
        )}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Genie anything..."
          placeholderTextColor={COLORS.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { icon: 'chatbox-ellipses', label: 'Suggest Reply' },
          { icon: 'bulb', label: 'Ice Breaker' },
          { icon: 'calendar', label: 'Date Idea' },
          { icon: 'gift', label: 'Gift Idea' },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={styles.quickAction}>
            <Ionicons name={action.icon as any} size={20} color={COLORS.primary} />
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genieIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.warning + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genieEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  suggestionsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  suggestionCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  useButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.card,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.card,
  },
  quickAction: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});