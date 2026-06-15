import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Theme colors
const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function AskScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const quickQuestions = [
    { icon: '🍔', text: 'Best biryani near Koramangala?' },
    { icon: '🛡️', text: 'Safe route to Indiranagar?' },
    { icon: '🏥', text: '24hr pharmacy nearby?' },
    { icon: '🎉', text: 'Networking events tonight?' },
    { icon: '🏋️', text: 'Gym with least crowd now?' },
    { icon: '💻', text: 'Café with good WiFi?' },
  ];

  const categories = [
    { icon: '🍔', label: 'Food & Drink', color: '#EF4444' },
    { icon: '🛡️', label: 'Safety', color: '#3B82F6' },
    { icon: '🔧', label: 'Services', color: '#F59E0B' },
    { icon: '🏠', label: 'Housing', color: '#8B5CF6' },
    { icon: '🎉', label: 'Events', color: '#EC4899' },
    { icon: '🏥', label: 'Health', color: '#10B981' },
    { icon: '🚇', label: 'Transport', color: '#06B6D4' },
    { icon: '🛒', label: 'Shopping', color: '#F97316' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Navigate to results
      router.push({
        pathname: '/ask/results',
        params: { query: query.trim() }
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setQuery(question);
    router.push({
      pathname: '/ask/results',
      params: { query }
    });
  };

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: '/ask/results',
      params: { query: category, category }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ask Buzz</Text>
          <Text style={styles.subtitle}>Your AI-powered local assistant</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ask anything about your area..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              multiline={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.askButton}
            onPress={handleSearch}
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Questions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestionsContainer}
          >
            {quickQuestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestion}
                onPress={() => handleQuickQuestion(item.text)}
              >
                <Text style={styles.quickQuestionIcon}>{item.icon as any}</Text>
                <Text style={styles.quickQuestionText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.label)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Queries */}
        {recentQueries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentQueries.map((q, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentQuery}
                onPress={() => handleQuickQuestion(q)}
              >
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.recentQueryText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Voice Input Button */}
        <TouchableOpacity style={styles.voiceButton}>
          <View style={styles.voiceButtonInner}>
            <Ionicons name="mic" size={24} color={colors.primary} />
            <Text style={styles.voiceButtonText}>Tap to speak</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  askButton: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  quickQuestionsContainer: {
    gap: 12,
    paddingRight: 16,
  },
  quickQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  quickQuestionIcon: {
    fontSize: 20,
  },
  quickQuestionText: {
    fontSize: 14,
    color: colors.textPrimary,
    maxWidth: 200,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recentQuery: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
    gap: 12,
  },
  recentQueryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  voiceButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  voiceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 12,
  },
  voiceButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
});
