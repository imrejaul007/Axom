import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';
import { Button } from '@/components/ui';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          {/* Logo Area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="location" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>BuzzLocal</Text>
            <Text style={styles.tagline}>
              Discover what's happening around you
            </Text>
          </View>

          {/* Illustration */}
          <View style={styles.illustration}>
            <View style={styles.mapContainer}>
              <View style={styles.mapPin}>
                <Ionicons name="pin" size={32} color={COLORS.accent} />
              </View>
              <View style={[styles.mapPin, styles.mapPin2]}>
                <Ionicons name="pin" size={24} color={COLORS.success} />
              </View>
              <View style={[styles.mapPin, styles.mapPin3]}>
                <Ionicons name="pin" size={20} color={COLORS.coinGold} />
              </View>
              <View style={styles.pulseRing} />
              <View style={[styles.pulseRing, styles.pulseRing2]} />
            </View>
          </View>

          {/* Features Preview */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Local Events</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="newspaper" size={20} color={COLORS.accent} />
              <Text style={styles.featureText}>News & Alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="wallet" size={20} color={COLORS.coinGold} />
              <Text style={styles.featureText}>Earn Coins</Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttons}>
            <Button
              title="Get Started"
              onPress={() => router.push('/(auth)/interests')}
              size="large"
              style={styles.primaryButton}
            />
            <Button
              title="I already have an account"
              variant="ghost"
              onPress={() => router.push('/(auth)/connect-account')}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapPin: {
    position: 'absolute',
    top: 40,
    left: 60,
  },
  mapPin2: {
    top: 80,
    right: 50,
    left: undefined,
  },
  mapPin3: {
    bottom: 50,
    left: 50,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  pulseRing2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: COLORS.primary + '20',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  buttons: {
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    marginBottom: SPACING.md,
  },
});
