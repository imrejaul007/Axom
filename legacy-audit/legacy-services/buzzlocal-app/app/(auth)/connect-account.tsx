import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';

export default function ConnectAccountScreen() {
  const router = useRouter();
  const { setUser, setOnboardingCompleted, selectedInterests } = useAuthStore();

  const handleConnect = async () => {
    // Simulate connecting to RABTUL auth
    // In production, this would call rez-auth-service
    try {
      // Mock user data
      const mockUser = {
        id: 'user_' + Date.now(),
        username: 'new_user',
        displayName: 'New Explorer',
        avatar: undefined,
        bio: 'Exploring the city!',
        reputation: 0,
        reputationLevel: 'Explorer' as const,
        coinBalance: 100, // Welcome bonus
        interests: selectedInterests,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        isCreator: false,
      };

      setUser(mockUser);
      setOnboardingCompleted(true);
      router.replace('/(main)');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect account. Please try again.');
    }
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={64} color={COLORS.coinGold} />
        </View>

        <Text style={styles.title}>Connect Your Account</Text>
        <Text style={styles.subtitle}>
          Link your ReZ account to sync coins, history, and rewards across the
          ecosystem
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.featureText}>
              Sync your existing ReZ Coins
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.featureText}>
              Access your saved places and posts
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.featureText}>
              Keep your badges and achievements
            </Text>
          </View>
        </View>

        <View style={styles.bonus}>
          <View style={styles.bonusBadge}>
            <Ionicons name="gift" size={20} color={COLORS.accent} />
            <Text style={styles.bonusText}>New Users Get 100 ReZ Coins!</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Connect ReZ Account"
          onPress={handleConnect}
          size="large"
          icon={<Ionicons name="link" size={20} color={COLORS.text} />}
        />
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Continue without connecting</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.coinGold,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    lineHeight: 22,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  featureText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  bonus: {
    marginTop: SPACING.lg,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  bonusText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
});
