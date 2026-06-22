/**
 * Crisis Volunteer - Register as a crisis volunteer (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const SKILLS = [
  { id: 'first_aid', label: 'First Aid / Medical', icon: 'medkit', color: '#EF4444' },
  { id: 'rescue', label: 'Water Rescue / Swimming', icon: 'water', color: '#3B82F6' },
  { id: 'driving', label: 'Driving / Transport', icon: 'car', color: '#F97316' },
  { id: 'cooking', label: 'Cooking / Food Prep', icon: 'restaurant', color: '#FBBF24' },
  { id: 'shelter', label: 'Shelter Setup', icon: 'bed', color: '#8B5CF6' },
  { id: 'communication', label: 'Communication / Radio', icon: 'radio', color: '#EC4899' },
  { id: 'logistics', label: 'Logistics / Supply', icon: 'cube', color: '#10B981' },
  { id: 'counseling', label: 'Psychological First Aid', icon: 'people', color: '#06B6D4' },
];

const AVAILABILITY_OPTIONS = [
  { id: 'immediate', label: 'Available Immediately', icon: 'flash' },
  { id: 'few_hours', label: 'Available in Few Hours', icon: 'time' },
  { id: 'scheduled', label: 'Can Join on Schedule', icon: 'calendar' },
];

export default function CrisisVolunteerScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>('immediate');
  const [hasVehicle, setHasVehicle] = useState(false);
  const [hasBoat, setHasBoat] = useState(false);
  const [canWorkNight, setCanWorkNight] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return false;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return false;
    }
    if (selectedSkills.length === 0) {
      Alert.alert('Required', 'Please select at least one skill');
      return false;
    }
    if (!agreed) {
      Alert.alert('Required', 'Please agree to the volunteer terms');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Registration Complete',
        'Thank you for volunteering! You will be contacted when your help is needed.',
        [
          {
            text: 'View Resources',
            onPress: () => router.replace('/crisis/resources'),
          },
          {
            text: 'Go Home',
            onPress: () => router.push('/(main)/index'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Become a Volunteer</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Hero Section */}
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'transparent']}
            style={styles.heroGradient}
          >
            <View style={styles.heroSection}>
              <View style={styles.heroIconContainer}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.heroIcon}>
                  <Ionicons name="heart" size={40} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.heroTitle}>Your Help Saves Lives</Text>
              <Text style={styles.heroSubtitle}>
                Join our network of trained volunteers ready to respond during crises.
                Every skill matters!
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNumber}>2,500+</Text>
                  <Text style={styles.heroStatLabel}>Volunteers</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNumber}>150+</Text>
                  <Text style={styles.heroStatLabel}>Crises Handled</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="person" size={20} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="call" size={20} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor={COLORS.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail" size={20} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills *</Text>
            <Text style={styles.sectionSubtitle}>
              Select skills you can contribute during crises
            </Text>

            <View style={styles.skillsGrid}>
              {SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[
                      styles.skillCard,
                      isSelected && { borderColor: skill.color, borderWidth: 2 },
                    ]}
                    onPress={() => toggleSkill(skill.id)}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={[skill.color + '20', skill.color + '10']}
                        style={styles.skillCardGradient}
                      >
                        <View style={[styles.skillIconSelected, { backgroundColor: skill.color }]}>
                          <Ionicons name={skill.icon as any} size={20} color="#fff" />
                        </View>
                        <Text style={[styles.skillLabelSelected, { color: skill.color }]}>
                          {skill.label}
                        </Text>
                        <View style={[styles.checkBadge, { backgroundColor: skill.color }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={styles.skillCardInactive}>
                        <View style={[styles.skillIcon, { backgroundColor: skill.color + '20' }]}>
                          <Ionicons name={skill.icon as any} size={20} color={skill.color} />
                        </View>
                        <Text style={styles.skillLabel}>{skill.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>

            {AVAILABILITY_OPTIONS.map((option) => {
              const isSelected = availability === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.radioOption, isSelected && styles.radioOptionSelected]}
                  onPress={() => setAvailability(option.id)}
                >
                  <LinearGradient
                    colors={isSelected ? [COLORS.primary, '#7C3AED'] : ['transparent', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.radioGradient}
                  >
                    <View style={styles.radioContent}>
                      <View style={[styles.radioIcon, isSelected && styles.radioIconSelected]}>
                        <Ionicons
                          name={option.icon as any}
                          size={20}
                          color={isSelected ? '#fff' : COLORS.textSecondary}
                        />
                      </View>
                      <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                        {option.label}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Resources Available */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resources Available</Text>

            <View style={styles.switchCard}>
              <View style={styles.switchInfo}>
                <View style={[styles.switchIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="car" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.switchTexts}>
                  <Text style={styles.switchLabel}>Have a Vehicle</Text>
                  <Text style={styles.switchDescription}>Can transport people or supplies</Text>
                </View>
              </View>
              <Switch
                value={hasVehicle}
                onValueChange={setHasVehicle}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={hasVehicle ? COLORS.primary : '#fff'}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchInfo}>
                <View style={[styles.switchIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="water" size={20} color="#3B82F6" />
                </View>
                <View style={styles.switchTexts}>
                  <Text style={styles.switchLabel}>Have a Boat</Text>
                  <Text style={styles.switchDescription}>For water rescue operations</Text>
                </View>
              </View>
              <Switch
                value={hasBoat}
                onValueChange={setHasBoat}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={hasBoat ? COLORS.primary : '#fff'}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchInfo}>
                <View style={[styles.switchIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Ionicons name="moon" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.switchTexts}>
                  <Text style={styles.switchLabel}>Can Work Night Shifts</Text>
                  <Text style={styles.switchDescription}>Available for overnight operations</Text>
                </View>
              </View>
              <Switch
                value={canWorkNight}
                onValueChange={setCanWorkNight}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={canWorkNight ? COLORS.primary : '#fff'}
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="alert-circle" size={20} color={COLORS.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Emergency contact number"
                placeholderTextColor={COLORS.textMuted}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Agreement */}
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>
              I agree to follow volunteer guidelines and safety protocols during crisis
              operations. I understand the risks involved and will prioritize my safety while
              helping others.
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={submitting ? [COLORS.textSecondary, COLORS.textMuted] : ['#EF4444', '#DC2626']}
              style={styles.submitGradient}
            >
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {submitting ? 'Registering...' : 'Register as Volunteer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroGradient: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  heroSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: SPACING.md,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroStatNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  heroStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  skillCardGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 100,
  },
  skillCardInactive: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
  },
  skillIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  skillIconSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  skillLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
  skillLabelSelected: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOption: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  radioOptionSelected: {},
  radioGradient: {
    borderRadius: BORDER_RADIUS.lg,
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
  radioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  radioIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  radioLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    flex: 1,
  },
  radioLabelSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  switchTexts: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  agreementRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {},
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
});
