// RZ-M-B8: Biometric re-authentication for high-value transactions.
// Requires expo-local-authentication package. Falls back gracefully when unavailable.

import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

const HIGH_VALUE_THRESHOLD_PAISE = 100000; // ₹1,000 in paise

export function useBiometricAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Returns true if the amount exceeds the high-value threshold, requiring biometric auth.
   * @param amountPaise Amount in paise
   */
  function requiresBiometric(amountPaise: number): boolean {
    return amountPaise >= HIGH_VALUE_THRESHOLD_PAISE;
  }

  /**
   * Checks if the device supports biometric authentication.
   */
  async function isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  /**
   * Prompts for biometric re-authentication.
   * Returns true if authentication succeeded, false otherwise.
   */
  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    setIsAuthenticating(true);
    try {
      const available = await isBiometricAvailable();
      if (!available) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason ?? 'Verify your identity for this transaction',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch {
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return { requiresBiometric, isBiometricAvailable, authenticate, isAuthenticating };
}
