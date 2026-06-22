import React, { useState, useEffect } from 'react';
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
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useAuthStore, useLocationStore } from '@/store';

export default function ScanScreen() {
  const router = useRouter();
  const { user, updateCoinBalance } = useAuthStore();
  const { currentLocation } = useLocationStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isCheckingIn) return;
    setScanned(true);

    try {
      // Parse QR data
      const qrData = JSON.parse(data);
      const { placeId, placeName, action } = qrData;

      if (action === 'checkin') {
        setIsCheckingIn(true);

        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Award coins
        const reward = 25;
        updateCoinBalance(reward);

        Alert.alert(
          'Checked In! 🎉',
          `You've checked in at ${placeName || 'this place'}!\n\nYou earned ${reward} ReZ Coins!`,
          [
            {
              text: 'Great!',
              onPress: () => {
                setScanned(false);
                setIsCheckingIn(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not recognized. Make sure you\'re scanning a BuzzLocal QR code.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleManualCheckIn = () => {
    router.push('/manual-checkin');
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={64} color={COLORS.textMuted} />
          </View>
          <Text style={styles.title}>Camera Access Required</Text>
          <Text style={styles.message}>
            BuzzLocal needs camera access to scan QR codes for check-ins.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleManualCheckIn}
          >
            <Text style={styles.secondaryButtonText}>Check in manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                {isCheckingIn && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Checking in...</Text>
                  </View>
                )}
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </CameraView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            <Ionicons name="qr-code" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Point at a BuzzLocal QR Code</Text>
            <Text style={styles.instructionText}>
              Find QR codes at cafes, events, shops, and venues to check in and earn coins!
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleManualCheckIn}
          >
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Check in manually</Text>
          </TouchableOpacity>
        </View>

        {/* Rewards Info */}
        <View style={styles.rewardInfo}>
          <Ionicons name="gift" size={20} color={COLORS.coinGold} />
          <Text style={styles.rewardText}>
            Earn 25+ ReZ Coins per check-in!
          </Text>
        </View>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  scannerContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  instructions: {
    padding: SPACING.lg,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  quickActionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.coinGold + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  rewardText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.coinGold,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  permissionButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
