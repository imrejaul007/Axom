/**
 * CreatePlanScreen — multi-step plan creation
 * Step 0: Experience credit selection (shown only if credits available)
 * Step 1: Category
 * Step 2: Details (title, merchant, booking ref, date/time)
 * Step 3: Preferences (gender, age, vibe, verified-only)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planAPI, experienceCreditAPI } from '../services/api';

type Step = 'experience' | 'category' | 'details' | 'preferences';

type CreditTier = 'SILVER' | 'GOLD' | 'PLATINUM';

interface ExperienceCredit {
  id:       string;
  tier:     CreditTier;
  type:     'COFFEE_BRUNCH' | 'DINNER_FOR_TWO' | 'PREMIUM_EXPERIENCE';
  label:    string;
  expiresAt: string;
}

const CREDIT_TYPE_TO_CATEGORY: Record<ExperienceCredit['type'], string> = {
  COFFEE_BRUNCH:      'BRUNCH',
  DINNER_FOR_TWO:     'DINNER',
  PREMIUM_EXPERIENCE: 'SPA',
};

const TIER_COLORS: Record<CreditTier, { bg: string; border: string; text: string }> = {
  SILVER:   { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6' },
  GOLD:     { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
  PLATINUM: { bg: '#ede9fe', border: '#a78bfa', text: '#3730a3' },
};

const CATEGORIES = [
  { value: 'DINNER',    label: 'Dinner',    emoji: '🍽️' },
  { value: 'LUNCH',     label: 'Lunch',     emoji: '🥗' },
  { value: 'BREAKFAST', label: 'Breakfast', emoji: '☕' },
  { value: 'BRUNCH',    label: 'Brunch',    emoji: '🥞' },
  { value: 'SPA',       label: 'Spa',       emoji: '💆' },
  { value: 'SALON',     label: 'Salon',     emoji: '💅' },
  { value: 'SHOPPING',  label: 'Shopping',  emoji: '🛍️' },
  { value: 'BADMINTON', label: 'Badminton', emoji: '🏸' },
  { value: 'SPORTS',    label: 'Sports',    emoji: '⚽' },
  { value: 'GAMING',    label: 'Gaming',    emoji: '🎮' },
];

const GENDER_PREFS = [
  { value: 'ANY',       label: 'Anyone' },
  { value: 'MALE',      label: 'Men' },
  { value: 'FEMALE',    label: 'Women' },
  { value: 'NON_BINARY', label: 'Non-binary' },
];

const VIBES = [
  { value: 'CASUAL',  label: 'Casual' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'QUICK',   label: 'Quick' },
  { value: 'WEEKEND', label: 'Weekend' },
];

export default function CreatePlanScreen({
  navigation,
  route,
}: {
  navigation: { goBack: () => void; replace: (s: string) => void };
  route?: { params?: { experienceCreditId?: string } };
}) {
  const qc = useQueryClient();

  // Pre-selected credit from ExperienceWalletScreen navigation
  const preselectedCreditId = route?.params?.experienceCreditId;

  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(preselectedCreditId || null);
  const [selectedCredit, setSelectedCredit]       = useState<ExperienceCredit | null>(null);

  const { data: creditsData, isLoading: creditsLoading } = useQuery<{ credits: ExperienceCredit[] }>({
    queryKey: ['experience-credits-available'],
    queryFn: () => experienceCreditAPI.getAvailable().then((r) => r.data),
  });

  const availableCredits = creditsData?.credits ?? [];
  const hasCredits       = availableCredits.length > 0;

  // Determine initial step: show experience step only if user has credits and no pre-selected credit
  const initialStep: Step = (hasCredits && !preselectedCreditId) ? 'experience' : 'category';
  const [step, setStep] = useState<Step>(initialStep);

  const [category, setCategory]         = useState('');
  const [title, setTitle]               = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantId, setMerchantId]     = useState('');
  const [rezBookingRef, setRezBookingRef] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [city, setCity]                 = useState('');
  const [genderPref, setGenderPref]     = useState('ANY');
  const [ageMin, setAgeMin]             = useState('18');
  const [ageMax, setAgeMax]             = useState('35');
  const [vibe, setVibe]                 = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // When a credit is selected, pre-fill category
  const handleSelectCredit = (credit: ExperienceCredit) => {
    setSelectedCreditId(credit.id);
    setSelectedCredit(credit);
    const mappedCategory = CREDIT_TYPE_TO_CATEGORY[credit.type];
    if (mappedCategory) setCategory(mappedCategory);
    setStep('category');
  };

  const handleSkipCredit = () => {
    setSelectedCreditId(null);
    setSelectedCredit(null);
    setStep('category');
  };

  // If navigated here with a pre-selected credit, find the credit object once data loads
  const resolvedCredit: ExperienceCredit | null = selectedCredit
    || (preselectedCreditId ? (availableCredits.find((c) => c.id === preselectedCreditId) ?? null) : null);

  const mutation = useMutation({
    mutationFn: () => {
      // R2-M1: Guard against empty date/time — Invalid Date would throw in .toISOString()
      if (!scheduledDate || !scheduledTime) {
        throw new Error('Please enter a date and time for your meetup');
      }
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      return planAPI.create({
        category,
        title,
        merchantName,
        merchantId: merchantId || merchantName.toLowerCase().replace(/\s+/g, '_'),
        rezBookingRef,
        scheduledAt,
        city,
        genderPreference: genderPref,
        ageMin: parseInt(ageMin, 10),
        ageMax: parseInt(ageMax, 10),
        vibe: vibe || undefined,
        verifiedOnly,
        ...(selectedCreditId ? { experienceCreditId: selectedCreditId } : {}),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans-feed'] });
      qc.invalidateQueries({ queryKey: ['my-plans'] });
      qc.invalidateQueries({ queryKey: ['experience-credits'] });
      qc.invalidateQueries({ queryKey: ['experience-credits-available'] });
      Alert.alert('Plan Created!', 'Your plan is live. People can now apply.');
      navigation.replace('Plans');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      Alert.alert('Error', err.response?.data?.message || 'Could not create plan'),
  });

  const usingCredit    = !!selectedCreditId;
  // When using a credit, booking ref is optional (credit IS the booking)
  const canProceedDetails = title.trim().length >= 4 && merchantName.trim().length >= 2
    && (usingCredit || rezBookingRef.trim().length >= 4) && scheduledDate && city.trim().length >= 2;

  if (creditsLoading && !preselectedCreditId) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;
  }

  const progressSteps: Step[] = hasCredits
    ? ['experience', 'category', 'details', 'preferences']
    : ['category', 'details', 'preferences'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      {/* Progress */}
      <View style={styles.progress}>
        {progressSteps.map((s, i) => (
          <View key={s} style={[styles.dot,
            step === s && styles.dotActive,
            progressSteps.indexOf(step) > i && styles.dotDone,
          ]} />
        ))}
      </View>

      {/* Credit banner — shown during details/preferences if credit selected */}
      {usingCredit && resolvedCredit && step !== 'experience' && (
        <View style={styles.creditBanner}>
          <Text style={styles.creditBannerText}>Using: {resolvedCredit.label}</Text>
        </View>
      )}

      {/* Step 0: Experience Credit */}
      {step === 'experience' && (
        <View>
          <Text style={styles.title}>You have Experience Rewards!</Text>
          <Text style={styles.sub}>Use one to create a special plan</Text>

          {availableCredits.map((credit) => {
            const colors = TIER_COLORS[credit.tier];
            return (
              <TouchableOpacity
                key={credit.id}
                style={[styles.creditCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => handleSelectCredit(credit)}
              >
                <Text style={[styles.creditCardLabel, { color: colors.text }]}>{credit.label}</Text>
                <Text style={styles.creditCardSub}>
                  {credit.tier} · Expires {new Date(credit.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkipCredit}>
            <Text style={styles.skipBtnText}>Skip — use my own booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1: Category */}
      {step === 'category' && (
        <View>
          <Text style={styles.title}>What are you planning?</Text>
          <Text style={styles.sub}>Buy the session from REZ first, then post here</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.catCard, category === c.value && styles.catCardSelected]}
                onPress={() => setCategory(c.value)}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, category === c.value && styles.catLabelSelected]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.btnRow}>
            {hasCredits && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('experience')}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, !category && styles.btnDisabled, { flex: 1 }]}
              disabled={!category}
              onPress={() => setStep('details')}
            >
              <Text style={styles.btnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <View>
          <Text style={styles.title}>Plan details</Text>

          <Text style={styles.label}>Plan title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Dinner for 2 at Smoke House Deli"
            maxLength={120}
          />

          <Text style={styles.label}>Merchant name</Text>
          <TextInput style={styles.input} value={merchantName} onChangeText={setMerchantName} placeholder="Restaurant / venue name" />

          {!usingCredit && (
            <>
              <Text style={styles.label}>REZ Booking Reference</Text>
              <TextInput
                style={styles.input}
                value={rezBookingRef}
                onChangeText={setRezBookingRef}
                placeholder="Paste your REZ booking ref"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>Book from REZ app first — paste the booking ID here</Text>
            </>
          )}

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={scheduledDate} onChangeText={setScheduledDate} placeholder="2026-04-20" maxLength={10} />

          <Text style={styles.label}>Time (HH:MM)</Text>
          <TextInput style={styles.input} value={scheduledTime} onChangeText={setScheduledTime} placeholder="20:00" maxLength={5} keyboardType="numbers-and-punctuation" />

          <Text style={styles.label}>City</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Mumbai" />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('category')}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, !canProceedDetails && styles.btnDisabled, { flex: 1 }]}
              disabled={!canProceedDetails}
              onPress={() => setStep('preferences')}
            >
              <Text style={styles.btnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Preferences */}
      {step === 'preferences' && (
        <View>
          <Text style={styles.title}>Who are you looking for?</Text>

          <Text style={styles.label}>Open to</Text>
          <View style={styles.chipRow}>
            {GENDER_PREFS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, genderPref === g.value && styles.chipSelected]}
                onPress={() => setGenderPref(g.value)}
              >
                <Text style={[styles.chipText, genderPref === g.value && styles.chipTextSelected]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Age range</Text>
          <View style={styles.ageRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={ageMin} onChangeText={setAgeMin} keyboardType="numeric" maxLength={2} placeholder="18" />
            <Text style={styles.ageSep}>—</Text>
            <TextInput style={[styles.input, { flex: 1 }]} value={ageMax} onChangeText={setAgeMax} keyboardType="numeric" maxLength={2} placeholder="35" />
          </View>

          <Text style={styles.label}>Vibe (optional)</Text>
          <View style={styles.chipRow}>
            {VIBES.map((v) => (
              <TouchableOpacity
                key={v.value}
                style={[styles.chip, vibe === v.value && styles.chipSelected]}
                onPress={() => setVibe(vibe === v.value ? '' : v.value)}
              >
                <Text style={[styles.chipText, vibe === v.value && styles.chipTextSelected]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => setVerifiedOnly(!verifiedOnly)}>
            <View style={[styles.toggle, verifiedOnly && styles.toggleOn]}>
              <View style={[styles.toggleKnob, verifiedOnly && styles.toggleKnobOn]} />
            </View>
            <Text style={styles.toggleLabel}>Verified users only</Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('details')}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { flex: 1 }, mutation.isPending && styles.btnDisabled]}
              disabled={mutation.isPending}
              onPress={() => mutation.mutate()}
            >
              {mutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Post Plan 🎉</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  progress:        { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 28, marginTop: 4 },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: '#eee' },
  dotActive:       { backgroundColor: '#7c3aed', width: 24 },
  dotDone:         { backgroundColor: '#c4b5fd' },
  creditBanner:    { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1.5, borderColor: '#fcd34d' },
  creditBannerText:{ color: '#d97706', fontWeight: '700', fontSize: 14 },
  creditCard:      { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  creditCardLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  creditCardSub:   { fontSize: 12, color: '#888' },
  skipBtn:         { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  skipBtnText:     { color: '#999', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  title:          { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  sub:            { fontSize: 13, color: '#888', marginBottom: 20 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  catCard:        { width: '30%', aspectRatio: 1, borderRadius: 14, borderWidth: 1.5, borderColor: '#eee', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  catCardSelected:{ borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  catEmoji:       { fontSize: 26, marginBottom: 4 },
  catLabel:       { fontSize: 11, fontWeight: '600', color: '#555' },
  catLabelSelected: { color: '#7c3aed' },
  label:          { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#fafafa' },
  hint:           { fontSize: 11, color: '#888', marginTop: 4 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#eee' },
  chipSelected:   { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextSelected: { color: '#7c3aed' },
  ageRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ageSep:         { fontSize: 18, color: '#555' },
  toggleRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 12 },
  toggle:         { width: 44, height: 24, borderRadius: 12, backgroundColor: '#eee', justifyContent: 'center', padding: 2 },
  toggleOn:       { backgroundColor: '#7c3aed' },
  toggleKnob:     { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobOn:   { alignSelf: 'flex-end' },
  toggleLabel:    { fontSize: 14, fontWeight: '600', color: '#333' },
  btnRow:         { flexDirection: 'row', gap: 10, marginTop: 28 },
  btn:            { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled:    { opacity: 0.4 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn:        { borderWidth: 1.5, borderColor: '#eee', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', marginTop: 28 },
  backBtnText:    { color: '#555', fontSize: 15, fontWeight: '600' },
});
