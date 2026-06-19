import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { profileAPI, referralAPI } from '../services/api';

type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY';
type Intent = 'DATING' | 'FRIENDSHIP' | 'NETWORKING';
type Step = 'basics' | 'about' | 'preferences' | 'done';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Man' },
  { value: 'FEMALE', label: 'Woman' },
  { value: 'NON_BINARY', label: 'Non-binary' },
];

const INTENT_OPTIONS: { value: Intent; label: string; emoji: string; desc: string }[] = [
  { value: 'DATING', label: 'Dating', emoji: '💘', desc: 'Looking for a meaningful connection' },
  { value: 'FRIENDSHIP', label: 'Friendship', emoji: '🤝', desc: 'Making new friends' },
  { value: 'NETWORKING', label: 'Networking', emoji: '💼', desc: 'Professional connections' },
];

export default function ProfileSetupScreen({ navigation }: { navigation: { replace: (s: string) => void } }) {
  const [step, setStep] = useState<Step>('basics');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [interestedIn, setInterestedIn] = useState<Gender[]>([]);
  const [intent, setIntent] = useState<Intent>('DATING');
  const [bio, setBio] = useState('');

  const createMutation = useMutation({
    mutationFn: () => {
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
        return Promise.reject(new Error('Please enter a valid age (18-120)'));
      }
      return profileAPI.create({ name, age: parsedAge, city, gender, interestedIn, intent, bio });
    },
    onSuccess: async () => {
      // RZ-M-S1: Consume pending referral code from deep link
      try {
        const code = await AsyncStorage.getItem('pending_referral_code');
        if (code) {
          await referralAPI.applyCode(code);
          await AsyncStorage.removeItem('pending_referral_code');
        }
      } catch {
        // Non-critical: referral credit will be applied later by backend cron
      }
      navigation.replace('Main');
    },
    onError: (err: { message?: string; response?: { data?: { error?: string; message?: string } } }) =>
      Alert.alert('Error', err.message || err.response?.data?.message ?? err.response?.data?.error || 'Could not create profile'),
  });

  const toggleInterest = (g: Gender) => {
    setInterestedIn((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const parsedAge = parseInt(age);
  const canProceedBasics = name.trim().length >= 2 && !isNaN(parsedAge) && parsedAge >= 18 && city.trim().length >= 2;
  const canProceedAbout = !!gender && interestedIn.length > 0;

  if (step === 'done') {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>You're all set!</Text>
        <Text style={styles.doneSub}>
          You're in a community of real, verified people.{'\n'}
          Swipe with confidence — trust comes first here.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Start Discovering →</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      {/* Progress */}
      <View style={styles.progress}>
        {(['basics', 'about', 'preferences'] as Step[]).map((s, i) => (
          <View key={s} style={[styles.progressDot, step === s && styles.progressDotActive,
            (['basics', 'about', 'preferences'] as Step[]).indexOf(step) > i && styles.progressDotDone]} />
        ))}
      </View>

      {step === 'basics' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Let's start with the basics</Text>

          <Text style={styles.label}>Your name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="First name" />

          <Text style={styles.label}>Your age</Text>
          <TextInput style={styles.input} value={age} onChangeText={(text) => {
            const numeric = text.replace(/\D/g, '');
            setAge(numeric.slice(0, 3));
          }}
            placeholder="18" keyboardType="numeric" maxLength={3} />

          <Text style={styles.label}>Your city</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Mumbai" />

          <TouchableOpacity
            style={[styles.primaryBtn, !canProceedBasics && styles.btnDisabled]}
            onPress={() => setStep('about')} disabled={!canProceedBasics}>
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'about' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>About you</Text>

          <Text style={styles.label}>I am a...</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.optionChip, gender === g.value && styles.optionChipSelected]}
                onPress={() => setGender(g.value)}
              >
                <Text style={[styles.optionText, gender === g.value && styles.optionTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Interested in...</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.optionChip, interestedIn.includes(g.value) && styles.optionChipSelected]}
                onPress={() => toggleInterest(g.value)}
              >
                <Text style={[styles.optionText, interestedIn.includes(g.value) && styles.optionTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !canProceedAbout && styles.btnDisabled]}
            onPress={() => setStep('preferences')} disabled={!canProceedAbout}>
            <Text style={styles.primaryBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'preferences' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>What are you looking for?</Text>

          {INTENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.intentCard, intent === opt.value && styles.intentCardSelected]}
              onPress={() => setIntent(opt.value)}
            >
              <Text style={styles.intentEmoji}>{opt.emoji}</Text>
              <View style={styles.intentInfo}>
                <Text style={[styles.intentLabel, intent === opt.value && styles.intentLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.intentDesc}>{opt.desc}</Text>
              </View>
              {intent === opt.value && <Text style={styles.intentCheck}>✓</Text>}
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Bio (optional)</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio} onChangeText={setBio}
            placeholder="Tell people something interesting about yourself..."
            multiline maxLength={300}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('done')}>
            <Text style={styles.primaryBtnText}>Almost done →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progress: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32, marginTop: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#eee' },
  progressDotActive: { backgroundColor: '#7c3aed', width: 24 },
  progressDotDone: { backgroundColor: '#c4b5fd' },
  stepContainer: { gap: 0 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#fafafa' },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fff' },
  optionChipSelected: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  optionText: { fontSize: 14, color: '#555', fontWeight: '600' },
  optionTextSelected: { color: '#7c3aed' },
  intentCard: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#eee', borderRadius: 14, padding: 16, gap: 12, marginBottom: 10,
  },
  intentCardSelected: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  intentEmoji: { fontSize: 28 },
  intentInfo: { flex: 1 },
  intentLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  intentLabelSelected: { color: '#7c3aed' },
  intentDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  intentCheck: { fontSize: 18, color: '#7c3aed' },
  primaryBtn: { marginTop: 24, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },
  doneSub: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  doneSubBold: { fontSize: 15, color: '#7c3aed', fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
