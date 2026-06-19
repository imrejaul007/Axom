/**
 * AI Compatibility Screen
 * Shows detailed compatibility analysis between users
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiMatchmakingService } from '../../services/ai/matchmaking';

const COLORS = {
  primary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#0f0f23',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

export default function AICompatibilityScreen() {
  const { matchId, matchName, matchPhoto } = useLocalSearchParams<{
    matchId: string;
    matchName: string;
    matchPhoto: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [personality, setPersonality] = useState<any>(null);

  useEffect(() => {
    loadCompatibility();
  }, [matchId]);

  const loadCompatibility = async () => {
    try {
      const [compScore, personalityProfile] = await Promise.all([
        aiMatchmakingService.getCompatibilityScore('currentUser', matchId || 'mock'),
        aiMatchmakingService.getPersonalityProfile(matchId || 'mock'),
      ]);
      setCompatibility(compScore);
      setPersonality(personalityProfile);
    } catch (error) {
      console.error('Failed to load compatibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Moderate Match';
    return 'Challenge Ahead';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing compatibility...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {}} style={styles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Compatibility</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Overall Score */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNumber, { color: getScoreColor(compatibility?.overall || 0) }]}>
            {compatibility?.overall || 0}%
          </Text>
          <Text style={styles.scoreLabel}>{getScoreLabel(compatibility?.overall || 0)}</Text>
        </View>

        <View style={styles.matchProfile}>
          <Image
            source={{ uri: matchPhoto || 'https://via.placeholder.com/80' }}
            style={styles.matchPhoto}
          />
          <Text style={styles.matchName}>{matchName}</Text>
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compatibility Breakdown</Text>
        <View style={styles.breakdownCard}>
          {Object.entries(compatibility?.breakdown || {}).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={[styles.breakdownValue, { color: getScoreColor(value) }]}>
                  {value}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${value}%`, backgroundColor: getScoreColor(value) },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Reasons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why You Match</Text>
        <View style={styles.reasonsCard}>
          {compatibility?.reasons?.map((reason: string, index: number) => (
            <View key={index} style={styles.reasonItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Strengths */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationship Strengths</Text>
        <View style={styles.strengthsCard}>
          {compatibility?.strengths?.map((strength: string, index: number) => (
            <View key={index} style={styles.strengthItem}>
              <Text style={styles.strengthEmoji}>💪</Text>
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Growth Areas</Text>
        <View style={styles.challengesCard}>
          {compatibility?.challenges?.map((challenge: string, index: number) => (
            <View key={index} style={styles.challengeItem}>
              <Text style={styles.challengeEmoji}>🌱</Text>
              <Text style={styles.challengeText}>{challenge}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Insight</Text>
        <View style={styles.summaryCard}>
          <Ionicons name="bulb" size={24} color={COLORS.warning} />
          <Text style={styles.summaryText}>{compatibility?.aiSummary}</Text>
        </View>
      </View>

      {/* Personality */}
      {personality && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality Analysis</Text>
          <View style={styles.personalityCard}>
            <View style={styles.personalityItem}>
              <Text style={styles.personalityLabel}>Personality Type</Text>
              <Text style={styles.personalityValue}>{personality.personalityType}</Text>
            </View>
            <View style={styles.personalityItem}>
              <Text style={styles.personalityLabel}>Love Language</Text>
              <Text style={styles.personalityValue}>
                {personality.loveLanguage?.join(', ')}
              </Text>
            </View>
            <View style={styles.personalityItem}>
              <Text style={styles.personalityLabel}>Communication Style</Text>
              <Text style={styles.personalityValue}>{personality.communicationStyle}</Text>
            </View>
            <View style={styles.personalityItem}>
              <Text style={styles.personalityLabel}>Attachment Style</Text>
              <Text style={styles.personalityValue}>{personality.attachmentStyle}</Text>
            </View>
            <View style={styles.personalityItem}>
              <Text style={styles.personalityLabel}>Emotional Intelligence</Text>
              <Text style={styles.personalityValue}>{personality.emotionalIntelligence}/100</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  matchProfile: {
    alignItems: 'center',
    marginTop: 16,
  },
  matchPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  reasonsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  strengthsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  strengthEmoji: {
    fontSize: 20,
  },
  strengthText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  challengesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  challengeEmoji: {
    fontSize: 20,
  },
  challengeText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  personalityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  personalityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  personalityLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  personalityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
