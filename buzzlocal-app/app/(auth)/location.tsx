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
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useLocationStore } from '@/store';

export default function LocationScreen() {
  const router = useRouter();
  const {
    currentLocation,
    locationPermission,
    setCurrentLocation,
    setLocationPermission,
    setLoadingLocation,
  } = useLocationStore();

  const requestLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted' ? 'granted' : 'denied');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        router.push('/(auth)/connect-account');
      } else {
        Alert.alert(
          'Location Required',
          'BuzzLocal needs your location to show nearby content. You can enable it in Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const skipLocation = () => {
    router.push('/(auth)/connect-account');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.step}>3 of 3</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.subtitle}>
          Get personalized content based on what's happening around you
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Local Events</Text>
              <Text style={styles.benefitDescription}>
                See events happening near you
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="notifications" size={20} color={COLORS.accent} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Local Alerts</Text>
              <Text style={styles.benefitDescription}>
                Get notified about nearby alerts
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="compass" size={20} color={COLORS.coinGold} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Better Recommendations</Text>
              <Text style={styles.benefitDescription}>
                Discover places you'll love
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.privacyText}>
            Your location is only used to show nearby content. We never share
            your exact location with others.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Enable Location"
          onPress={requestLocation}
          size="large"
          icon={<Ionicons name="location" size={20} color={COLORS.text} />}
        />
        <TouchableOpacity style={styles.skipButton} onPress={skipLocation}>
          <Text style={styles.skipText}>Skip for now</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  step: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
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
    paddingHorizontal: SPACING.lg,
  },
  benefits: {
    alignSelf: 'stretch',
    marginBottom: SPACING.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
  },
  privacyText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    lineHeight: 18,
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
