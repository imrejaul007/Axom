import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { societyApi } from '../../src/services/societyService';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

const PURPOSE_OPTIONS = [
  { value: 'family', label: 'Family', icon: 'people' },
  { value: 'friend', label: 'Friend', icon: 'person' },
  { value: 'delivery', label: 'Delivery', icon: 'cube' },
  { value: 'service', label: 'Service', icon: 'construct' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function AddVisitorScreen() {
  const { id, societyName } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: 'family' as 'family' | 'friend' | 'delivery' | 'service' | 'other',
    flatNumber: '',
    expectedDate: new Date().toISOString().split('T')[0],
    expectedTime: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.visitorName.trim()) {
      Alert.alert('Error', 'Please enter visitor name');
      return;
    }
    if (!formData.flatNumber.trim()) {
      Alert.alert('Error', 'Please enter flat number');
      return;
    }

    try {
      setLoading(true);
      const result = await societyApi.addVisitor(id as string, {
        visitorName: formData.visitorName.trim(),
        visitorPhone: formData.visitorPhone.trim() || undefined,
        purpose: formData.purpose,
        expectedDate: formData.expectedDate,
        expectedTime: formData.expectedTime || undefined,
        flatNumber: formData.flatNumber.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Visitor Added',
          `${formData.visitorName} has been added. You will be notified when they arrive.`,
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add visitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Add Visitor', headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Visitor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Add visitor details to generate a QR pass for gate entry
          </Text>
        </View>

        {/* Visitor Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Visitor Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter visitor's full name"
            placeholderTextColor={colors.textMuted}
            value={formData.visitorName}
            onChangeText={(text) => setFormData({ ...formData, visitorName: text })}
          />
        </View>

        {/* Visitor Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textMuted}
            value={formData.visitorPhone}
            onChangeText={(text) => setFormData({ ...formData, visitorPhone: text })}
            keyboardType="phone-pad"
          />
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purpose of Visit *</Text>
          <View style={styles.purposeGrid}>
            {PURPOSE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.purposeBtn,
                  formData.purpose === option.value && styles.purposeBtnActive,
                ]}
                onPress={() => setFormData({ ...formData, purpose: option.value as any })}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={formData.purpose === option.value ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.purposeLabel,
                    formData.purpose === option.value && styles.purposeLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Flat Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Flat Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., B-204"
            placeholderTextColor={colors.textMuted}
            value={formData.flatNumber}
            onChangeText={(text) => setFormData({ ...formData, flatNumber: text })}
            autoCapitalize="characters"
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={formData.expectedDate}
            onChangeText={(text) => setFormData({ ...formData, expectedDate: text })}
          />
        </View>

        {/* Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected Time (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 14:00"
            placeholderTextColor={colors.textMuted}
            value={formData.expectedTime}
            onChangeText={(text) => setFormData({ ...formData, expectedTime: text })}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes for security..."
            placeholderTextColor={colors.textMuted}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color={colors.textPrimary} />
              <Text style={styles.submitBtnText}>Add Visitor</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: colors.surface,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  form: { flex: 1 },
  formContent: { padding: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.surfaceLight },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  purposeBtn: { width: '31%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 16, margin: '1%', borderWidth: 1, borderColor: colors.surfaceLight },
  purposeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  purposeLabel: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  purposeLabelActive: { color: colors.primary, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, marginTop: 20, marginBottom: 40 },
  submitBtnDisabled: { backgroundColor: colors.textMuted },
  submitBtnText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
});
