import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';

const COMMUNITY_TYPES = [
  { id: 'area', label: 'Area', icon: 'location', description: 'Neighborhood, locality, area' },
  { id: 'interest', label: 'Interest', icon: 'heart', description: 'Hobby, passion, topic' },
  { id: 'apartment', label: 'Apartment', icon: 'home', description: 'Residential complex' },
  { id: 'campus', label: 'Campus', icon: 'school', description: 'College, university' },
];

export default function CreateCommunityScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '',
    isPrivate: false,
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm({ ...form, [key]: value });
  };

  const handleCreate = async () => {
    if (!form.name || !form.description || !form.type) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Success! 🎉',
        'Community created!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create community');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Community</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Community Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Koramangala Foodies"
              placeholderTextColor={COLORS.textMuted}
              value={form.name}
              onChangeText={(v) => updateForm('name', v)}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this community about?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(v) => updateForm('description', v)}
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Community Type *</Text>
            {COMMUNITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeOption,
                  form.type === type.id && styles.typeOptionActive,
                ]}
                onPress={() => updateForm('type', type.id)}
              >
                <View style={[
                  styles.typeIcon,
                  form.type === type.id && styles.typeIconActive,
                ]}>
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={form.type === type.id ? COLORS.text : COLORS.textMuted}
                  />
                </View>
                <View style={styles.typeContent}>
                  <Text style={[
                    styles.typeLabel,
                    form.type === type.id && styles.typeLabelActive,
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </View>
                {form.type === type.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Privacy */}
          <View style={styles.field}>
            <Text style={styles.label}>Privacy</Text>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                !form.isPrivate && styles.privacyOptionActive,
              ]}
              onPress={() => updateForm('isPrivate', false)}
            >
              <Ionicons
                name="globe"
                size={24}
                color={!form.isPrivate ? COLORS.text : COLORS.textMuted}
              />
              <View style={styles.privacyContent}>
                <Text style={[
                  styles.privacyLabel,
                  !form.isPrivate && styles.privacyLabelActive,
                ]}>
                  Public
                </Text>
                <Text style={styles.privacyDescription}>
                  Anyone can join and see posts
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                form.isPrivate && styles.privacyOptionActive,
              ]}
              onPress={() => updateForm('isPrivate', true)}
            >
              <Ionicons
                name="lock-closed"
                size={24}
                color={form.isPrivate ? COLORS.text : COLORS.textMuted}
              />
              <View style={styles.privacyContent}>
                <Text style={[
                  styles.privacyLabel,
                  form.isPrivate && styles.privacyLabelActive,
                ]}>
                  Private
                </Text>
                <Text style={styles.privacyDescription}>
                  Members need approval to join
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Reward */}
          <View style={styles.rewardInfo}>
            <Ionicons name="gift" size={20} color={COLORS.coinGold} />
            <Text style={styles.rewardText}>
              You'll earn 50 ReZ Coins for creating this community!
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <Button
            title="Create Community"
            onPress={handleCreate}
            loading={isLoading}
            disabled={!form.name || !form.type}
          />
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  field: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  typeIconActive: {
    backgroundColor: COLORS.primary,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  typeLabelActive: {
    color: COLORS.text,
  },
  typeDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privacyOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  privacyContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  privacyLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  privacyLabelActive: {
    color: COLORS.text,
  },
  privacyDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.coinGold + '10',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  rewardText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.coinGold,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
});
