/**
 * Report Incident - Submit safety incidents
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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

const INCIDENT_TYPES = [
  { id: 'harassment', icon: 'warning', label: 'Harassment', color: '#EF4444' },
  { id: 'theft', icon: 'card', label: 'Theft', color: '#F97316' },
  { id: 'assault', icon: 'medkit', label: 'Assault', color: '#DC2626' },
  { id: 'suspicious', icon: 'eye', label: 'Suspicious Activity', color: '#FBBF24' },
  { id: 'accident', icon: 'car', label: 'Accident', color: '#3B82F6' },
  { id: 'other', icon: 'ellipsis-horizontal', label: 'Other', color: '#6B7280' },
];

export default function ReportIncidentScreen() {
  const router = useRouter();
  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        const address = reverseGeocode[0] as any;
        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          address: address
            ? `${address.street || ''}, ${address.subLocality || ''}, ${address.city || ''}`
            : 'Unknown location',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not take photo');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!incidentType) {
      Alert.alert('Required', 'Please select an incident type');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe the incident');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Our team will review and take action.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency?',
      'Do you need immediate help?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Call SOS',
          style: 'destructive',
          onPress: () => router.push('/safe/sos'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <TouchableOpacity onPress={handleSOS}>
            <View style={styles.sosButton}>
              <Ionicons name="warning" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Incident Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What happened? *</Text>
            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    incidentType === type.id && { borderColor: type.color, borderWidth: 2 },
                  ]}
                  onPress={() => setIncidentType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={incidentType === type.id ? type.color : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      incidentType === type.id && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief title for the incident"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what happened, when, where, and unknown other details..."
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity style={styles.locationCard} onPress={getCurrentLocation}>
              {location ? (
                <>
                  <Ionicons name="location" size={20} color={COLORS.success} />
                  <Text style={styles.locationText}>{location.address}</Text>
                  <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
                </>
              ) : (
                <>
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.locationPlaceholder}>Tap to get current location</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos/Evidence</Text>
            <View style={styles.photoRow}>
              {images.map((uri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <Ionicons name="images" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.photoHint}>{images.length}/3 photos added</Text>
          </View>

          {/* Anonymous Option */}
          <TouchableOpacity
            style={styles.anonymousRow}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <Ionicons
              name={isAnonymous ? 'checkbox' : 'square-outline'}
              size={24}
              color={isAnonymous ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={styles.anonymousText}>Submit anonymously</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  sosButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  locationText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  locationPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  photoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  photoButton: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  anonymousText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
