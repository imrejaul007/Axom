import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { authAPI, profileAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

type Step = 'phone' | 'otp' | 'linking';

const OTP_COOLDOWN_MS = 60_000; // 60 seconds

export default function LoginScreen({ navigation }: { navigation: { replace: (s: string) => void } }) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  // RD-M-03 FIX: Track when the OTP button can be clicked again (cooldown).
  // setCanResendAt is called after a successful OTP request to set the unblock timestamp.
  const [canResendAt, setCanResendAt] = useState<number | null>(null);
  const cooldownTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Tick down cooldown every second while active
  useEffect(() => {
    if (canResendAt === null) {
      setCooldownSeconds(0);
      if (cooldownTickRef.current) { clearInterval(cooldownTickRef.current); cooldownTickRef.current = null; }
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((canResendAt - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        setCanResendAt(null);
        if (cooldownTickRef.current) { clearInterval(cooldownTickRef.current); cooldownTickRef.current = null; }
      }
    };
    tick();
    cooldownTickRef.current = setInterval(tick, 1000);
    return () => { if (cooldownTickRef.current) clearInterval(cooldownTickRef.current); };
  }, [canResendAt]);

  const { setToken, setProfile } = useAuthStore();

  // C-3 FIX: Replaced simulated OTP with real REZ OTP service integration.
  // In __DEV__ mode a simulation path is preserved so engineers can test without
  // hitting the live REZ auth endpoint. In production the real service is always used.
  const requestOtp = useMutation({
    mutationFn: async () => {
      if (__DEV__ && process.env.EXPO_PUBLIC_SIMULATE_OTP === 'true') {
        // DEV-only simulation: skip real OTP for local development
        await new Promise((r) => setTimeout(r, 400));
        return;
      }

      // Production: call real REZ OTP endpoint
      const BASE = process.env.EXPO_PUBLIC_REZ_AUTH_URL;
      if (!BASE) throw new Error('REZ_AUTH_URL not configured');

      const res = await fetch(`${BASE}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // R2-H6: Strip non-digits first, then apply country code — prevents
        // double-prefix when user already entered +91 or 91 prefix.
        body: JSON.stringify({ phone: (() => {
          const clean = phone.replace(/\D/g, '');
          return clean.startsWith('91') ? `+${clean}` : `+91${clean}`;
        })() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'OTP request failed');
      }
    },
    onSuccess: () => {
      setStep('otp');
      // RD-M-03 FIX: Start 60-second cooldown so users cannot spam OTP requests.
      setCanResendAt(Date.now() + OTP_COOLDOWN_MS);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Could not send OTP. Check your number.';
      Alert.alert('Error', message);
    },
  });

  const verifyAndLogin = useMutation({
    mutationFn: async () => {
      let rezToken: string;

      if (__DEV__ && process.env.EXPO_PUBLIC_SIMULATE_OTP === 'true') {
        // DEV-only simulation path — never reaches production
        rezToken = `rez_sim_${phone}_${otp}`;
      } else {
        // Production: verify OTP with real REZ auth endpoint and exchange for JWT
        const BASE = process.env.EXPO_PUBLIC_REZ_AUTH_URL;
        if (!BASE) throw new Error('REZ_AUTH_URL not configured');

        const res = await fetch(`${BASE}/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${phone}`, otp }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message || 'OTP verification failed');
        }

        // R2-H5: Validate token in response body before using it.
        // If backend returns { error } instead of { token }, body.token is undefined.
        const body = await res.json() as { token?: string; error?: string };
        if (!body.token) throw new Error(body.error || 'No token received from auth server');
        rezToken = body.token;
      }

      const res = await authAPI.verifyRezToken(rezToken);
      return res.data;
    },
    onSuccess: async (data) => {
      // Backend returns token: null for new users (profile does not exist yet).
      // Only store the token when it is present — storing null would wipe any
      // existing token and cause 401s in ProfileSetupScreen.
      if (data.token) {
        await setToken(data.token);
      }
      if (data.hasProfile) {
        setProfile(data.profile);
        navigation.replace('Main');
      } else {
        navigation.replace('ProfileSetup');
      }
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Invalid OTP or REZ account not found.';
      Alert.alert('Verification Failed', message);
    },
  });

  const isValidPhone = phone.replace(/\D/g, '').length === 10;
  const isValidOtp = otp.length === 6;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Rendez</Text>
        <Text style={styles.tagline}>Trust-first dating.</Text>
        <Text style={styles.trustNote}>Every profile is identity-verified via REZ</Text>
      </View>

      <View style={styles.card}>
        {step === 'phone' && (
          <>
            <Text style={styles.title}>Sign in with REZ</Text>
            <Text style={styles.sub}>
              Enter your REZ registered mobile number
            </Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              style={[styles.btn, (!isValidPhone || cooldownSeconds > 0) && styles.btnDisabled]}
              onPress={() => requestOtp.mutate()}
              disabled={!isValidPhone || requestOtp.isPending || cooldownSeconds > 0}
            >
              {requestOtp.isPending
                ? <ActivityIndicator color="#fff" />
                : cooldownSeconds > 0
                  ? <Text style={styles.btnText}>Resend in {cooldownSeconds}s</Text>
                  : <Text style={styles.btnText}>Send OTP →</Text>}
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              Rendez is for verified REZ users only. Your identity is protected — no public display of your REZ account details.
            </Text>
          </>
        )}

        {step === 'otp' && (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.sub}>
              Sent to +91 {phone}
            </Text>
            <TextInput
              style={[styles.phoneInput, styles.otpInput]}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, !isValidOtp && styles.btnDisabled]}
              onPress={() => verifyAndLogin.mutate()}
              disabled={!isValidOtp || verifyAndLogin.isPending}
            >
              {verifyAndLogin.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify & Continue →</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
              <Text style={styles.backText}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by</Text>
        <Text style={styles.rezBadge}>REZ</Text>
        <Text style={styles.footerText}>ecosystem</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'space-between', padding: 24 },
  header: { alignItems: 'center', paddingTop: 60 },
  logo: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  tagline: { fontSize: 15, color: '#a78bfa', marginTop: 8 },
  trustNote: { fontSize: 11, color: '#6d28d9', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 20 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  countryCode: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#fafafa',
  },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: '#444' },
  phoneInput: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 18,
    letterSpacing: 1, backgroundColor: '#fafafa',
  },
  otpInput: { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  btn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backText: { color: '#7c3aed', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingBottom: 16 },
  footerText: { color: '#666', fontSize: 13 },
  rezBadge: { color: '#7c3aed', fontWeight: '800', fontSize: 14 },
});
