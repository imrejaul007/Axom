import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

interface Persona {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}

const PERSONAS: Persona[] = [
  { id: 'food_scout', name: 'Food Scout', icon: '🍔', description: 'You discover the best local food spots', keywords: ['restaurant', 'biryani', 'cafe'] },
  { id: 'nightlife_hunter', name: 'Nightlife Hunter', icon: '🌙', description: 'You know where the party is', keywords: ['pub', 'bar', 'club'] },
  { id: 'fitness_enthusiast', name: 'Fitness Enthusiast', icon: '💪', description: 'You live for workouts', keywords: ['gym', 'yoga', 'fitness'] },
  { id: 'deal_hunter', name: 'Deal Hunter', icon: '🏷️', description: 'You always find bargains', keywords: ['sale', 'discount', 'offer'] },
  { id: 'event_insider', name: 'Event Insider', icon: '🎭', description: 'You never miss events', keywords: ['concert', 'festival', 'meetup'] },
  { id: 'society_guardian', name: 'Society Guardian', icon: '🏠', description: 'You keep community safe', keywords: ['society', 'security', 'neighbor'] },
  { id: 'startup_insider', name: 'Startup Insider', icon: '🚀', description: "You're connected to the startup world", keywords: ['networking', 'tech', 'business'] },
  { id: 'campus_leader', name: 'Campus Leader', icon: '🎓', description: "You're the go-to on campus", keywords: ['college', 'student', 'campus'] },
  { id: 'safety_first', name: 'Safety First', icon: '🛡️', description: 'Safety is your priority', keywords: ['safe', 'route', 'women'] },
  { id: 'commuter', name: 'Urban Commuter', icon: '🚇', description: 'You master transit', keywords: ['metro', 'bus', 'commute'] },
  { id: 'homebody', name: 'Home Body', icon: '🏡', description: 'You love staying in', keywords: ['home', 'delivery', 'cozy'] },
  { id: 'explorer', name: 'Local Explorer', icon: '🗺️', description: "You're always discovering", keywords: ['explore', 'discover', 'hidden gem'] },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'You rise with the sun', keywords: ['morning', 'breakfast', 'early'] },
  { id: 'late_owl', name: 'Late Owl', icon: '🦉', description: 'The night is your domain', keywords: ['night', 'late', 'midnight'] },
];

export default function PersonaScreen() {
  const [loading, setLoading] = useState(true);
  const [currentPersona, setCurrentPersona] = useState<string>('explorer');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const currentPersonaData = PERSONAS.find(p => p.id === currentPersona);
  const displayedPersonas = showAll ? PERSONAS : PERSONAS.slice(0, 6);

  const handleClaimPersona = (personaId: string) => {
    setCurrentPersona(personaId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Identity</Text>
        <Text style={styles.subtitle}>
          Choose how BuzzLocal understands you
        </Text>
      </View>

      {/* Current Persona */}
      <View style={styles.currentCard}>
        <View style={styles.currentBadge}>
          <Text style={styles.currentIcon}>{currentPersonaData?.icon}</Text>
        </View>
        <View style={styles.currentInfo}>
          <Text style={styles.currentLabel}>Your Persona</Text>
          <Text style={styles.currentName}>{currentPersonaData?.name}</Text>
          <Text style={styles.currentDesc}>{currentPersonaData?.description}</Text>
        </View>
      </View>

      {/* Auto-Detected Indicator */}
      <View style={styles.detectedCard}>
        <Ionicons name="bulb" size={20} color={colors.accentGold} />
        <View style={styles.detectedInfo}>
          <Text style={styles.detectedTitle}>Auto-detected from your activity</Text>
          <Text style={styles.detectedDesc}>
            Based on your searches, check-ins, and interactions
          </Text>
        </View>
      </View>

      {/* Claim Your Persona */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claim Your Persona</Text>
        <Text style={styles.sectionDesc}>
          Or choose a persona that matches you best
        </Text>

        <View style={styles.personaGrid}>
          {displayedPersonas.map((persona) => {
            const isActive = persona.id === currentPersona;
            return (
              <TouchableOpacity
                key={persona.id}
                style={[styles.personaCard, isActive && styles.personaCardActive]}
                onPress={() => handleClaimPersona(persona.id)}
              >
                <Text style={styles.personaIcon}>{persona.icon}</Text>
                <Text style={[styles.personaName, isActive && styles.personaNameActive]}>
                  {persona.name}
                </Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAll(!showAll)}>
          <Text style={styles.showMoreText}>
            {showAll ? 'Show Less' : `Show ${PERSONAS.length - 6} More`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Persona Traits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Traits</Text>
        <View style={styles.traitsGrid}>
          <View style={styles.traitCard}>
            <Ionicons name="moon" size={24} color={colors.primary} />
            <Text style={styles.traitLabel}>Night Owl</Text>
            <Text style={styles.traitValue}>65% match</Text>
          </View>
          <View style={styles.traitCard}>
            <Ionicons name="restaurant" size={24} color={colors.accent} />
            <Text style={styles.traitLabel}>Foodie</Text>
            <Text style={styles.traitValue}>82% match</Text>
          </View>
          <View style={styles.traitCard}>
            <Ionicons name="people" size={24} color={colors.accentGreen} />
            <Text style={styles.traitLabel}>Social</Text>
            <Text style={styles.traitValue}>45% match</Text>
          </View>
          <View style={styles.traitCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.textMuted} />
            <Text style={styles.traitLabel}>Safety</Text>
            <Text style={styles.traitValue}>70% match</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Food Scouts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.leaderboard}>
          {[
            { rank: 1, name: 'Priya S.', score: 2450, icon: '🍔' },
            { rank: 2, name: 'Rahul M.', score: 2100, icon: '🍔' },
            { rank: 3, name: 'Amit K.', score: 1850, icon: '🍔' },
          ].map((user) => (
            <View key={user.rank} style={styles.leaderItem}>
              <View style={[styles.leaderRank, user.rank <= 3 && styles.leaderRankTop]}>
                <Text style={styles.leaderRankText}>#{user.rank}</Text>
              </View>
              <Text style={styles.leaderIcon}>{user.icon}</Text>
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>{user.name}</Text>
                <Text style={styles.leaderScore}>{user.score} pts</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Streaks</Text>
        <View style={styles.streaksRow}>
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={24} color={colors.accent} />
            <Text style={styles.streakValue}>7</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.streakCard}>
            <Ionicons name="star" size={24} color={colors.accentGold} />
            <Text style={styles.streakValue}>12</Text>
            <Text style={styles.streakLabel}>Activities</Text>
          </View>
          <View style={styles.streakCard}>
            <Ionicons name="trophy" size={24} color={colors.primary} />
            <Text style={styles.streakValue}>3</Text>
            <Text style={styles.streakLabel}>Badges</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  currentCard: { flexDirection: 'row', backgroundColor: colors.primary + '20', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary },
  currentBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  currentIcon: { fontSize: 36 },
  currentInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  currentLabel: { fontSize: 12, color: colors.textMuted },
  currentName: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  currentDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  detectedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 24, gap: 12 },
  detectedInfo: { flex: 1 },
  detectedTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  detectedDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  personaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  personaCard: { width: '31%', backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', position: 'relative' },
  personaCardActive: { backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary },
  personaIcon: { fontSize: 28, marginBottom: 4 },
  personaName: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  personaNameActive: { color: colors.primary, fontWeight: '600' },
  activeBadge: { position: 'absolute', top: 6, right: 6 },
  showMoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
  showMoreText: { fontSize: 14, color: colors.primary },
  traitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  traitCard: { width: '48%', backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' },
  traitLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  traitValue: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 },
  seeAllText: { fontSize: 14, color: colors.primary },
  leaderboard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  leaderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  leaderRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  leaderRankTop: { backgroundColor: colors.accentGold + '30' },
  leaderRankText: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary },
  leaderIcon: { fontSize: 20 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  leaderScore: { fontSize: 12, color: colors.textMuted },
  streaksRow: { flexDirection: 'row', gap: 12 },
  streakCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' },
  streakValue: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginTop: 8 },
  streakLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
