import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function AskResultsScreen() {
  const { query } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<unknown[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState('');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnswer(`Based on your query about "${query}", here are some recommendations:

**Top-rated options near Koramangala:**

1. **Truffles** ⭐ 4.5
   - Famous for burgers and shakes
   - Located on 5th Cross
   - Budget: ₹300-500 for two
   - Current wait: ~15 mins

2. **Empire Restaurant** ⭐ 4.3
   - North Indian & Biryani
   - Near Sony World Junction
   - Budget: ₹400-600 for two
   - Current wait: ~20 mins

3. **The Black Pearl** ⭐ 4.6
   - Multi-cuisine, great ambience
   - Forum Mall Road
   - Budget: ₹600-900 for two
   - Current wait: ~10 mins

All restaurants have good safety ratings and are in well-lit, busy areas.`);
      setSources([
        { type: 'ai', name: 'REZ Mind', badge: '🤖 AI' },
        { type: 'community', name: 'Local Foodies', badge: '⭐ Trusted' },
        { type: 'location', name: 'Vibe Map Data', badge: '🗺️' }
      ]);
      setFollowUps([
        'Which has the shortest wait?',
        'Show me cheap options under ₹200',
        'Best for late-night food?',
        'Open restaurants now'
      ]);
      setLoading(false);
    }, 1500);
  }, [query]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding the best answer...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Query */}
      <Text style={styles.queryText}>"{query}"</Text>

      {/* Answer Card */}
      <View style={styles.answerCard}>
        <View style={styles.answerHeader}>
          <Text style={styles.answerLabel}>Answer</Text>
          <View style={styles.aiBadge}>
            <Ionicons name="bulb" size={14} color={colors.accentGold} />
            <Text style={styles.aiBadgeText}>Powered by REZ Mind</Text>
          </View>
        </View>
        <Text style={styles.answerText}>{answer}</Text>
      </View>

      {/* Sources */}
      <View style={styles.sourcesContainer}>
        <Text style={styles.sourcesTitle}>Sources</Text>
        <View style={styles.sourcesList}>
          {sources.map((source, index) => (
            <View key={index} style={styles.sourceItem}>
              <Text style={styles.sourceBadge}>{(source as any).badge}</Text>
              <Text style={styles.sourceName}>{(source as any).name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="navigate" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Get Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={20} color={colors.accentGreen} />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social" size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Follow-up Questions */}
      <Text style={styles.followUpTitle}>Follow-up Questions</Text>
      <View style={styles.followUpsContainer}>
        {followUps.map((followUp, index) => (
          <TouchableOpacity
            key={index}
            style={styles.followUpChip}
            onPress={() => router.push({ pathname: '/ask/results', params: { query: followUp } })}
          >
            <Text style={styles.followUpText}>{followUp}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Community Answers */}
      <Text style={styles.communityTitle}>Community Answers</Text>
      <View style={styles.communityCard}>
        <View style={styles.communityHeader}>
          <View style={styles.communityAvatar}>
            <Text style={styles.communityAvatarText}>AK</Text>
          </View>
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>Aditya K.</Text>
            <View style={styles.communityBadge}>
              <Ionicons name="star" size={10} color={colors.accentGold} />
              <Text style={styles.communityBadgeText}>Trusted Answerer</Text>
            </View>
          </View>
          <View style={styles.helpfulBadge}>
            <Ionicons name="thumbs-up" size={14} color={colors.accentGreen} />
            <Text style={styles.helpfulText}>42</Text>
          </View>
        </View>
        <Text style={styles.communityText}>
          I would recommend Truffles! Been going there for years. The cheese burger is amazing and they are open till 11 PM.
        </Text>
      </View>

      {/* Submit Your Answer */}
      <TouchableOpacity style={styles.submitAnswerButton}>
        <Ionicons name="add-circle" size={20} color={colors.primary} />
        <Text style={styles.submitAnswerText}>Submit Your Answer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  queryText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 20,
  },
  answerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGold + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    color: colors.accentGold,
  },
  answerText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  sourcesContainer: {
    marginBottom: 20,
  },
  sourcesTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  sourcesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sourceBadge: {
    fontSize: 12,
  },
  sourceName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  followUpsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  followUpChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  followUpText: {
    fontSize: 14,
    color: colors.primary,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  communityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityBadgeText: {
    fontSize: 11,
    color: colors.accentGold,
  },
  helpfulBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGreen + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  helpfulText: {
    fontSize: 12,
    color: colors.accentGreen,
    fontWeight: '600',
  },
  communityText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  submitAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  submitAnswerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
