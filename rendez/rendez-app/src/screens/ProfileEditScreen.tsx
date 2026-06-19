import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Platform, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI, uploadAPI, api } from '../services/api';

const INTENT_OPTIONS = [
  { value: 'DATING', label: '💘 Dating' },
  { value: 'FRIENDSHIP', label: '🤝 Friendship' },
  { value: 'NETWORKING', label: '💼 Networking' },
];

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Man' },
  { value: 'FEMALE', label: 'Woman' },
  { value: 'NON_BINARY', label: 'Non-binary' },
];

interface Profile {
  name: string;
  age: number;
  gender: string;
  interestedIn: string[];
  intent: string;
  city: string;
  bio?: string;
  photos: string[];
  isVerified: boolean;
  requireMessageRequest: boolean;
  verifiedOnly: boolean;
  onlyVerifiedCanLike: boolean;
}

export default function ProfileEditScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<number | null>(null);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile-me'],
    queryFn: () => profileAPI.getMe().then((r) => r.data),
  });

  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [intent, setIntent] = useState('DATING');
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [age, setAge] = useState(0);

  // Safety settings
  const [requireMessageRequest, setRequireMessageRequest] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [onlyVerifiedCanLike, setOnlyVerifiedCanLike] = useState(false);

  // Populate from profile once loaded
  React.useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setCity(profile.city);
      setIntent(profile.intent);
      setInterestedIn(profile.interestedIn);
      setPhotos(profile.photos);
      setAge(profile.age ?? 0);
      setRequireMessageRequest(profile.requireMessageRequest ?? false);
      setVerifiedOnly(profile.verifiedOnly ?? false);
      setOnlyVerifiedCanLike(profile.onlyVerifiedCanLike ?? false);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => profileAPI.update({
      bio, city, intent, interestedIn,
      requireMessageRequest, verifiedOnly, onlyVerifiedCanLike,
      age,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      Alert.alert('Saved', 'Your profile has been updated', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert('Error', 'Could not save. Try again.'),
  });

  const pickAndUploadPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });

    if (result.canceled) return;

    setUploading(index);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() || 'jpg';
      const formData = new FormData();
      // R2-H11 FIX: Append object directly to FormData without double-casting to Blob.
      // React Native's FormData accepts { uri, type, name } for file uploads.
      formData.append('photo', {
        uri,
        type: `image/${ext}`,
        name: `photo_${index}.${ext}`,
      } as unknown as File);
      formData.append('index', String(index));

      const response = await api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPhotos = [...photos];
      newPhotos[index] = response.data.url;
      setPhotos(newPhotos);
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Try again.');
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert('Remove photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const removed = photos[index];
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);
          try {
            await uploadAPI.deletePhoto(index);
          } catch {
            setPhotos((prev) => {
              const restored = [...prev];
              restored.splice(index, 0, removed);
              return restored;
            });
            Alert.alert('Error', 'Could not remove photo. Try again.');
          }
        },
      },
    ]);
  };

  const toggleInterestedIn = (gender: string) => {
    setInterestedIn((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender],
    );
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        <Text style={styles.hint}>First photo is your main photo. Tap to change, long-press to remove.</Text>
        <View style={styles.photoGrid}>
          {Array.from({ length: 6 }).map((_, i) => {
            const url = photos[i];
            return (
              <TouchableOpacity
                key={i}
                style={[styles.photoSlot, i === 0 && styles.mainPhotoSlot]}
                onPress={() => pickAndUploadPhoto(i)}
                onLongPress={() => url && removePhoto(i)}
              >
                {uploading === i ? (
                  <ActivityIndicator color="#7c3aed" />
                ) : url ? (
                  <Image source={{ uri: url }} style={styles.photo} />
                ) : (
                  <View style={styles.photoAdd}>
                    <Text style={styles.photoAddIcon}>+</Text>
                    {i === 0 && <Text style={styles.photoAddLabel}>Main</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About me</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Write a short bio to help people get to know you..."
          multiline
          maxLength={300}
          placeholderTextColor="#bbb"
        />
        <Text style={styles.charCount}>{bio.length}/300</Text>
      </View>

      {/* City */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>City</Text>
        <TextInput
          style={styles.textInput}
          value={city}
          onChangeText={setCity}
          placeholder="Your city"
          placeholderTextColor="#bbb"
        />
      </View>

      {/* Intent */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>I'm here for</Text>
        <View style={styles.chipRow}>
          {INTENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, intent === opt.value && styles.chipActive]}
              onPress={() => setIntent(opt.value)}
            >
              <Text style={[styles.chipText, intent === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interested in */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Interested in</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, interestedIn.includes(opt.value) && styles.chipActive]}
              onPress={() => toggleInterestedIn(opt.value)}
            >
              <Text style={[styles.chipText, interestedIn.includes(opt.value) && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Safety Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Safety & Privacy</Text>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Message request mode</Text>
            <Text style={styles.toggleSub}>People must send a preview before chatting. You approve first.</Text>
          </View>
          <Switch
            value={requireMessageRequest}
            onValueChange={setRequireMessageRequest}
            trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
            thumbColor={requireMessageRequest ? '#7c3aed' : '#f3f4f6'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Verified users only</Text>
            <Text style={styles.toggleSub}>Only REZ-verified profiles can see and contact you.</Text>
          </View>
          <Switch
            value={verifiedOnly}
            onValueChange={setVerifiedOnly}
            trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
            thumbColor={verifiedOnly ? '#7c3aed' : '#f3f4f6'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Only verified can like me</Text>
            <Text style={styles.toggleSub}>Unverified users won't see you in their feed.</Text>
          </View>
          <Switch
            value={onlyVerifiedCanLike}
            onValueChange={setOnlyVerifiedCanLike}
            trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
            thumbColor={onlyVerifiedCanLike ? '#7c3aed' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
        onPress={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { padding: 20, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  hint: { fontSize: 12, color: '#bbb', marginBottom: 12 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlot: {
    width: 100, height: 120, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e9d5ff', borderStyle: 'dashed',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#faf5ff',
  },
  mainPhotoSlot: { width: 160, height: 200, borderStyle: 'solid', borderColor: '#7c3aed', borderWidth: 2 },
  photo: { width: '100%', height: '100%' },
  photoAdd: { alignItems: 'center', gap: 4 },
  photoAddIcon: { fontSize: 28, color: '#c4b5fd' },
  photoAddLabel: { fontSize: 10, color: '#a78bfa', fontWeight: '600' },

  bioInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14,
    fontSize: 15, minHeight: 90, textAlignVertical: 'top', color: '#333',
  },
  charCount: { fontSize: 11, color: '#ccc', textAlign: 'right', marginTop: 6 },
  textInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#333',
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e9d5ff',
    backgroundColor: '#faf5ff',
  },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText: { fontSize: 13, color: '#888', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  saveBtn: {
    margin: 20, backgroundColor: '#7c3aed',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#bbb', fontSize: 14 },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  toggleSub:  { fontSize: 12, color: '#888', lineHeight: 16 },
});
